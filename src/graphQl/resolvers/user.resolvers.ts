import User, { IUserDocument } from "../../schema/user.schema";
import { IUser } from "../../types/user.types";
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
    users: async (parent: any, args: any, context: any) => {
      const userContext = requireAuth(context?.user);
      const users = await User.find({});
      return users;
    },

    user: async (parent: any, args: any, context: any) => {
      const userContext = requireAuth(context?.user);
      const { _id } = userContext;
      const user = await User.findById(_id);
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
    createUser: async (parent: any, { input }: { input: { username: string; email: string; password: string } }) => {
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

    login: async (parent: any, { input }: { input: { email: string; password: string } }) => {
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

    forgotPassword: async (parent: any, { input }: { input: { email: string; _id: string } }, context: any) => {
       const { email, _id } = input;
       
       const userContext = requireAuth(context?.user);
       const user = await User.findById(_id); 
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

    resetPassword: async (parent: any, { input }: { input: { oldPassword: string; newPassword: string; token: string } }, context: any) => {
        const { oldPassword, newPassword, token } = input;
        
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

    updateUser: async (parent: any, { input }: { input: {username?: string; phoneNo?: string; role?: "USER" | "ADMIN"} }, context: any) => {
        const userContext = requireAuth(context?.user);
        const { _id } = userContext;
        const updateData = input;

        const existingUser = await User.findById(_id);
        if (!existingUser) {
             throw new GraphQLError("User not found", {
                extensions: { code: "NOT_FOUND" },
            });
        }

        // Logic from controller for field filtering
        const fieldToUpdate: any = {};
        
        if(updateData?.phoneNo){
            if(existingUser?.phoneNo === updateData?.phoneNo){
                throw new GraphQLError("Phone number is same, Please provide a different phone number", {
                    extensions: { code: "BAD_REQUEST" },
                });
            }else{
              fieldToUpdate.phoneNo = updateData.phoneNo;
              fieldToUpdate.isPhoneNoVerified = false;
            }
        }

        Object.keys(updateData).forEach(
            (field: string) => {
              if (updateData[field as keyof typeof updateData] !== undefined  && field !== "phoneNo") {
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
            throw new GraphQLError("Unable to update user", {
                extensions: { code: "NOT_FOUND" },
            });
        }

        return updatedUser;
    },

    accountDeactivationRequest: async (parent: any, { input }: { input: { _id: string } }, context: any) => {
      const userContext = requireAuth(context?.user);
      const { _id } = input;
        
        const user = await User.findById(_id);
        if (!user) throw new GraphQLError("Unable to find user", {
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

    cancelDeactivationRequest: async (parent: any, { input }: { input: { _id: string } }, context: any) => {
      const userContext = requireAuth(context?.user);
      const { _id } = input;

        const user : IUserDocument | null = await User.findById(_id);
        if (!user) throw new GraphQLError("Unable to find user", {
            extensions: { code: "NOT_FOUND" },
        });
        
        if (!user.scheduledDeactivationAt) throw new GraphQLError("No pending account deactivation found", {
            extensions: { code: "BAD_REQUEST" },
        });

        user.deactivationRequestedAt = undefined;
        user.scheduledDeactivationAt = undefined; 

        await user.save({ validateBeforeSave: false });

        const htmlContent = cancelAccountDeactivationInHtml(user.username);

        await sendVerificationEmail(user.email, "Account Deactivation Cancelled", htmlContent);

        return { message: "Account deactivation cancelled successfully" };
    }
  },
};
