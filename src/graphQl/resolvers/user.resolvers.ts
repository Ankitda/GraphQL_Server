import User, { IUserDocument } from "../../schema/user.schema";
import { IUser } from "../../types/user.types";
import { userFields } from "../../constants/docFeilds.constants";
import ApiError from "../../utils/apiError";
import crypto from "crypto";
import {
  passwordChangeInHtml,
  resetPasswordInHtml,
} from "../../constants/htmlFormat";
import { sendVerificationEmail } from "../../utils/mailHelper";

export const userResolvers = {
  Query: {
    users: async (parent: any, { fieldsToFetch }: { fieldsToFetch?: string[] }) => {
      let projection: string | undefined;
      if (fieldsToFetch?.length) {
        const allowed = fieldsToFetch.filter((f) => userFields.includes(f));
        if (allowed.length) {
          projection = allowed.join(" ");
        }
      }
      const users = await User.find({}, projection);
      return users;
    },

    user: async (parent: any, { fieldsToFetch }: { fieldsToFetch?: string[] }, context: any) => {
      const userContext = context.user || context.req?.user;
      if (!userContext || !userContext._id) {
         throw new ApiError("Unauthorized", 401);
      }
      const { _id } = userContext;

      let projection: any = {};
      if (fieldsToFetch?.length) {
        projection = fieldsToFetch.reduce((acc: any, field: string) => {
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
      const userContext = context.user || context.req?.user;
      if (!userContext || !userContext.email) {
          throw new ApiError("Unauthorized", 401);
      }
      const { email } = userContext;
      const userOrders = await User.findAllOrdersByUser(email) as IUser;

      return userOrders.orders || []; 
    },
  },

  Mutation: {
    createUser: async (parent: any, { input }: { input: any }) => {
        const { username, email, password } = input;
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

    login: async (parent: any, { input }: { input: any }) => {
        const { email, password } = input;
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

    forgotPassword: async (parent: any, { input }: { input: any }, context: any) => {
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
       
       const { _id, email } = input;
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

    resetPassword: async (parent: any, { input }: { input: any }, context: any) => {
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

        const userContext = context.user || context.req?.user;
        if (!userContext || !userContext._id) {
             throw new ApiError("Unauthorized", 401);
        }
        const { _id } = userContext;
        
        const { oldPassword, newPassword, token } = input;
        
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
        const userContext = context.user || context.req?.user;
        if (!userContext || !userContext._id) {
            throw new ApiError("Unauthorized", 401);
        }
        const { _id } = userContext;
        const updateData = input;

        const existingUser = await User.findById(_id);
        if (!existingUser) {
             throw new ApiError("User not found", 404);
        }

        // Logic from controller for field filtering
        const fieldToUpdate = Object.keys(updateData).reduce(
            (acc: any, field: string) => {
              if (userFields.includes(field) && !["createdAt", "_id", "accountVerified", "password", "resetPasswordToken", "resetPasswordExpires", "isPhoneNoVerified", "deactivationRequestedAt", "scheduledDeactivationAt", "orders"].includes(field)) {
                acc[field] = updateData[field];
              }
              return acc;
            },
            {}
        );

        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { $set: fieldToUpdate },
            { runValidators: true, new: true }
        );

        return updatedUser;
    },

    accountDeactivationRequest: async (parent: any, { input }: { input: any }, context: any) => {
        // Input has username, email, _id, but controller uses req.user.
        // We should verify authorized user matches input or just use context.
        // I'll prioritize context for security if available, but check consistency.
        const userContext = context.user || context.req?.user;
        if (!userContext) throw new ApiError("Unauthorized", 401);
        
        const { _id } = userContext;
        // Verify input matches context if necessary, but controller just used context.
        // input in schema: username, email, _id.
        // We will ignore input for lookup and use context to be safe/consistent with controller, 
        // OR warn if they differ. 
        // Let's use context _id.
        
        const user = await User.findById(_id);
        if (!user) throw new ApiError("User not found", 404);

        if (!user.isActive) throw new ApiError("Account is already deactivated", 400);
        if (user.scheduledDeactivationAt) throw new ApiError("Account deactivation is already scheduled. You can cancel it if needed.", 400);

        const deactivationDate = new Date();
        deactivationDate.setDate(deactivationDate.getDate() + 2);

        user.deactivationRequestedAt = new Date();
        user.scheduledDeactivationAt = deactivationDate;
        await user.save({ validateBeforeSave: false });

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Account Deactivation Requested</h2>
                <p>Hi ${user.username},</p>
                <p>We received a request to deactivate your account. Your account will be deactivated on <strong>${deactivationDate.toLocaleString()}</strong>.</p>
                <p>If you didn't request this or changed your mind, you can cancel the deactivation anytime before the scheduled date by logging into your account.</p>
                <p>If you have any questions, please contact our support team.</p>
                <br/>
                <p>Best regards,<br/>The Team</p>
            </div>
        `;
        await sendVerificationEmail(user.email, "Account Deactivation Scheduled", htmlContent);

        return {
            message: "Account deactivation scheduled successfully",
            scheduledDeactivationAt: deactivationDate
        };
    },

    cancelDeactivationRequest: async (parent: any, { input }: { input: any }, context: any) => {
        const userContext = context.user || context.req?.user;
        if (!userContext) throw new ApiError("Unauthorized", 401);
        const { _id } = userContext;

        const user = await User.findById(_id);
        if (!user) throw new ApiError("User not found", 404);
        
        if (!user.scheduledDeactivationAt) throw new ApiError("No pending account deactivation found", 400);

        user.deactivationRequestedAt = undefined;
        user.scheduledDeactivationAt = undefined; // Type might be stricter in TS, explicitly set to undefined or null dependent on schema
        // In User schema it is likely Date | undefined.
        // Mongoose unsets with undefined or null usually.
        // user.deactivationRequestedAt = undefined; 
        // user.scheduledDeactivationAt = undefined;
        // The controller uses `undefined`.
        // To be safe with types if `undefined` isn't allowed by strict TS:
        (user as any).deactivationRequestedAt = undefined;
        (user as any).scheduledDeactivationAt = undefined;

        await user.save({ validateBeforeSave: false });

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Account Deactivation Cancelled</h2>
            <p>Hi ${user.username},</p>
            <p>Your account deactivation request has been successfully cancelled. Your account will remain active.</p>
            <p>If you have any questions, please contact our support team.</p>
            <br/>
            <p>Best regards,<br/>The Team</p>
          </div>
        `;

        await sendVerificationEmail(user.email, "Account Deactivation Cancelled", htmlContent);

        return { message: "Account deactivation cancelled successfully" };
    }
  },
};
