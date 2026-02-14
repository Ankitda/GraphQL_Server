import User, { IUserDocument } from "../../schema/user.schema";
import { IUser } from "../../types/user.types";
import { userFields } from "../../constants/docFeilds.constants";
import ApiError from "../../utils/apiError";
import crypto from "crypto";
import { GraphQLError } from "graphql";
import {
  callAccountDeactivationInHtml,
  cancelAccountDeactivationInHtml,
  passwordChangeInHtml,
  resetPasswordInHtml,
} from "../../constants/htmlFormat";
import { sendVerificationEmail } from "../../utils/mailHelper";
import { requireAuth } from "../../utils/graphqlHelper";

export const userResolvers = {
  Query: {
    users: async (parent: any, { fieldsToFetch }: { fieldsToFetch?: string[] }, context: any) => {
      const userContext = requireAuth(context?.user);

      let projection: Record<string, 1> = {};
      if (fieldsToFetch?.length) {
        const allowed = fieldsToFetch.filter((f) => userFields.includes(f));
        if (allowed.length) {
          projection = allowed.reduce((acc: Record<string, 1>, field: string) => {
            acc[field] = 1;
            return acc;
          }, {});
        }
      }
      const users = await User.find({}, projection);
      return users;
    },

    user: async (parent: any, { fieldsToFetch }: { fieldsToFetch?: string[] }, context: any) => {
      const userContext = requireAuth(context?.user);
      const { _id } = userContext;

      let projection: Record<string, 1> = {};
      if (fieldsToFetch?.length) {
        projection = fieldsToFetch.reduce((acc: Record<string, 1>, field: string) => {
          if (userFields.includes(field)) {
            acc[field] = 1;
          }
          return acc;
        }, {});
      }

      const user = await User.findById(_id, projection);
      if (!user) {
        throw new ApiError("User not found", 404);
      }
      return user;
    },

    userOrderHistory: async (parent: any, args: any, context: any) => {
      const userContext = requireAuth(context?.user);
      const { email } = userContext;
      const userOrders = await User.findAllOrdersByUser(email) as IUser;

      return userOrders.orders || []; 
    },
  },

  Mutation: {
    createUser: async (parent: any, { username, email, password }: { username: string; email: string; password: string }) => {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          throw new ApiError("User already exists", 400);
        }
        const newUser = await User.insertOne({
          username,
          email,
          password,
        });
        return newUser;
    },

    login: async (parent: any, { email, password }: { email: string; password: string }) => {
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
          throw new ApiError("Invalid email", 401);
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new ApiError("Invalid password", 401);
        }
        const token = user.generateAuthToken(86400);
        return { token };
    },

    forgotPassword: async (parent: any, { email, _id }: { email: string; _id: string }, context: any) => {
       // Controller uses req.user, but forgotPassword usually takes email from input if unauthenticated,
       // OR if it's an authenticated-only endpoint, it takes from context.
       // The Types definition has `input: forgotPasswordInput` which has `email` and `_id`.
       // However, context suggests typical flow is unauthenticated for forgot password? 
       // Controller `forgotPassword` implementation uses `req.user` which implies User must be logged in? 
       // Wait, `req.user` usually comes from auth middleware. 
       // If the endpoint is strictly for logged in users to reset, then `req.user` makes sense.
       // BUT, forgotPassword usually is for people who CAN'T log in.
       // Looking at the controller: `const { _id, email } = req.user as IUser;` -> It requires auth.
       // Looking at the Schema: `forgotPassword(input: forgotPasswordInput!): MessageResponse!`
       // `forgotPasswordInput` has `email` and `_id`.
       // I will use the input arguments as per the GraphQL schema, but the logic relies on finding the user.
       
       // ACTUALLY: The controller implementation looks surprisingly like it requires the user to be logged in (`req.user`). 
       // This seems odd for a "forgot password" feature (usually public), but I MUST follow the controller logic provided OR the schema.
       // unique situation: Schema passes ID and Email. Controller uses req.user. 
       // If I follow schema, I trust input. If I follow controller, I trust context.
       // Given common sense + schema input, I will use the input to find the user, 
       // BUT the controller explicitly grabs provided user. 
       // Let's stick closer to the schema args for finding the user, but use the logic for token generation.

       const userContext = requireAuth(context?.user);
       const user = await User.findById(_id); // Controller used _id from req.user
       if (!user) {
         throw new ApiError("User not found", 404);
       }
       // If email check is needed:
       if (user.email !== email) {
           throw new ApiError("Email does not match record", 400);
       }

       const resetToken = user.generatePasswordResetToken();
       await user.save({ validateBeforeSave: false });

       const link = `http://localhost:3000/reset-password?token=${resetToken}`;
       const htmlContent = resetPasswordInHtml(link);
       await sendVerificationEmail(email, "Reset your password", htmlContent);

       return { message: "Password reset email sent successfully." };
    },

    resetPassword: async (parent: any, { oldPassword, newPassword, token }: { oldPassword: string; newPassword: string; token: string }, context: any) => {
        // Controller uses req.user for `_id`? 
        // `const { _id } = req.user as { _id: string };`
        // This implies the user must be logged in to reset password? 
        // Combined with `forgotPassword` requiring auth, this app might use "Change Password" flow?
        // OR `req.user` is populated via the token provided?
        // Wait, `resetPassword` controller logic:
        // 1. Checks `token` from body.
        // 2. Hashes it.
        // 3. Finds user by `_id`.
        // 4. Verifies `user.resetPasswordToken` matches hashed token.
        // The issue is: where does `_id` come from in GraphQL?
        // The `ResetPasswordInput` in types has: `oldPassword`, `newPassword`, `token`. It DOES NOT have `_id`.
        // So how do we find the user?
        // In the controller, `_id` comes from `req.user`.
        // This strongly implies that `resetPassword` is an AUTHENTICATED endpoint.
        // So I must assume context.user exists.

        const userContext = requireAuth(context?.user);
        const { _id } = userContext;
        
        if (!token) throw new ApiError("Token is required", 400);

        const actualToken = crypto.createHash("sha256").update(token).digest("hex");
        
        const user = await User.findById(_id).select(
             "+password resetPasswordToken resetPasswordExpires username email"
        ) as IUserDocument;
        
        if (!user) {
            throw new ApiError("User not found", 404);
        }

        const now = Date.now();
        if (actualToken !== user.resetPasswordToken || now > user.resetPasswordExpires) {
             throw new ApiError("Invalid token Provided or Password reset token has expired", 400);
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            throw new ApiError("Invalid old password", 401);
        }

        user.password = newPassword;
        user.resetPasswordToken = "";
        user.resetPasswordExpires = 0;
        await user.save();

        const passwordChangeContent = passwordChangeInHtml(user.username);
        await sendVerificationEmail(user.email, "Password Changed Successfully", passwordChangeContent);

        return { message: "Password reset successfully" };
    },

    updateUser: async (parent: any, { input }: { input: any }, context: any) => {
        const userContext = requireAuth(context?.user);
        const { _id } = userContext;
        const updateData : {username?: string; phoneNo?: string; role?: "USER" | "ADMIN"} = input;

        const existingUser = await User.findById(_id);
        if (!existingUser) {
             throw new GraphQLError("User not found", {
                extensions: { code: "NOT_FOUND" },
            });
        }

        // Logic from controller for field filtering
        const fieldToUpdate: any = {};
        Object.keys(updateData).forEach(
            (field: string) => {
              if (updateData[field as keyof typeof updateData] !== undefined) {
                fieldToUpdate[field] = updateData[field as keyof typeof updateData];
              }
            }
        );

        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { $set: fieldToUpdate },
            { runValidators: true, new: true }
        );

        if (!updatedUser) {
            throw new GraphQLError("User not found", {
                extensions: { code: "NOT_FOUND" },
            });
        }

        return updatedUser;
    },

    accountDeactivationRequest: async (parent: any, { _id }: { _id: string }, context: any) => {
        const userContext = requireAuth(context?.user);
        
        const user = await User.findById(_id);
        if (!user) throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
        });

        if (!user.isActive) throw new GraphQLError("Account is already deactivated", {
            extensions: { code: "BAD_REQUEST" },
        });
        if (user.scheduledDeactivationAt) throw new GraphQLError("Account deactivation is already scheduled. You can cancel it if needed.", {
            extensions: { code: "BAD_REQUEST" },
        });

        const deactivationDate = new Date();
        deactivationDate.setDate(deactivationDate.getDate() + 2);

        user.deactivationRequestedAt = new Date();
        user.scheduledDeactivationAt = deactivationDate;
        await user.save({ validateBeforeSave: false });

        const htmlContent = callAccountDeactivationInHtml(user.username, deactivationDate);
        await sendVerificationEmail(user.email, "Account Deactivation Scheduled", htmlContent);

        return {
            message: "Account deactivation scheduled successfully",
            scheduledDeactivationAt: deactivationDate
        };
    },

    cancelDeactivationRequest: async (parent: any, { _id }: { _id: string }, context: any) => {
        const userContext = requireAuth(context?.user);

        const user : IUserDocument | null = await User.findById(_id);
        if (!user) throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
        });
        
        if (!user.scheduledDeactivationAt) throw new GraphQLError("No pending account deactivation found", {
            extensions: { code: "BAD_REQUEST" },
        });

        user.deactivationRequestedAt = undefined;
        user.scheduledDeactivationAt = undefined; // Type might be stricter in TS, explicitly set to undefined or null dependent on schema
        // In User schema it is likely Date | undefined.
        // Mongoose unsets with undefined or null usually.
        // user.deactivationRequestedAt = undefined; 
        // user.scheduledDeactivationAt = undefined;
        // The controller uses `undefined`.
        // To be safe with types if `undefined` isn't allowed by strict TS:

        await user.save({ validateBeforeSave: false });

        const htmlContent = cancelAccountDeactivationInHtml(user.username);

        await sendVerificationEmail(user.email, "Account Deactivation Cancelled", htmlContent);

        return { message: "Account deactivation cancelled successfully" };
    }
  },
};
