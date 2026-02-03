import { Request, Response } from "express";
import errorWrapper from "../utils/errorCatching";
import crypto from "crypto";
import User, { IUserDocument } from "../schema/user.schema";
import { IUser } from "../types/user.types";
import ApiError from "../utils/apiError";
import { userFields } from "../constants/docFeilds.constants";
import {
  callAccountDeactivationInHtml,
  cancelAccountDeactivationInHtml,
  passwordChangeInHtml,
  resetPasswordInHtml,
} from "../constants/htmlFormat";
import { sendVerificationEmail } from "../utils/mailHelper";

export const createUser = errorWrapper(async (req: Request, res: Response) => {
  const { username, email, password } = req.body as IUser;

  const user = await User.findByEmail(email);

  if (user) {
    throw new ApiError("User already exists", 400);
  }

  const newUser = await User.insertOne({
    username,
    email,
    password,
  });

  res.status(201).json(newUser);
});

export const userLogin = errorWrapper(async (req: Request, res: Response) => {
  const { email, password } = req.body as IUser;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError("Invalid email", 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError("Invalid password", 401);
  }

  const token = user.generateAuthToken(86400);

  res.status(200).json({ token });
});

export const forgotPassword = errorWrapper(
  async (req: Request, res: Response) => {
    const { _id, email } = req.user as IUser;

    const user = await User.findById(_id);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Generate a password reset token
    const resetToken = user.generatePasswordResetToken();

    user.save({ validateBeforeSave: false });

    const link = `http://localhost:3000/reset-password?token=${resetToken}`;

    // Send the password reset email
    const htmlContent = resetPasswordInHtml(link);
    await sendVerificationEmail(email, "Reset your password", htmlContent);

    res
      .status(200)
      .json({ message: "Password reset email sent successfully." });
  }
);

export const resetPassword = errorWrapper(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword, token } = req.body as {
      oldPassword: string;
      newPassword: string;
      token: string;
    };
    const { _id } = req.user as { _id: string };

    if (!token) throw new ApiError("Token is required", 400);

    const actualToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = (await User.findById(_id).select(
      "+password resetPasswordToken resetPasswordExpires username email"
    )) as IUserDocument;
    const now = Date.now();

    if (
      actualToken !== user.resetPasswordToken ||
      now > user.resetPasswordExpires
    ) {
      throw new ApiError(
        "Invalid token Provided or Password reset token has expired",
        400
      );
    }

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      throw new ApiError("Invalid old password", 401);
    }

    user.password = newPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = 0;
    await user.save();

    const passwordChangeMail = passwordChangeInHtml(user.username);

    await sendVerificationEmail(
      user.email,
      "Password Changed Successfully",
      passwordChangeMail
    );

    res.status(200).json({ message: "Password reset successfully" });
  }
);

export const updateUser = errorWrapper(async (req: Request, res: Response) => {
  const { _id } = req.user as { _id: string };
  const updateData = req.body as Partial<IUser>;

  const existingUser = await User.findById(_id);

  if (!existingUser) {
    throw new ApiError("User not found", 404);
  }

  //Dynamic field update
  const fieldToUpdate = Object.keys(updateData).reduce(
    (acc: Record<string, any>, field: string) => {
      if (userFields.includes(field) && !["createdAt", "_id", "accountVerified", "password", "resetPasswordToken", "resetPasswordExpires", "isPhoneNoVerified", "deactivationRequestedAt", "scheduledDeactivationAt", "orders"].includes(field)) {
        (acc as any)[field] = (updateData as any)[field];
      }
      return acc;
    },
    {} as Record<string, any>
  );

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    { $set: fieldToUpdate },
    {
      runValidators: true,
      new: true,
    }
  );

  res.status(200).json(updatedUser);
});

export const findUserById = errorWrapper(
  async (req: Request, res: Response) => {
    const { _id } = req.user as { _id: string };
    const { fieldsToFetch } = req.body as { fieldsToFetch: string[] };

    // build a projection string containing only allowed fields (Mongoose accepts a space-separated string)
    let projection: any = {} as any;

    if (fieldsToFetch?.length) {
      projection = fieldsToFetch.reduce(
        (acc: Record<string, any>, field: string) => {
          if (userFields.includes(field)) {
            (acc as any)[field] = 1;
          }
          return acc;
        },
        {} as Record<string, any>
      );
    }
    const user = await User.findById(_id, projection);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    res.status(200).json(user);
  }
);

export const getAllUsers = errorWrapper(async (req: Request, res: Response) => {
  const { fieldsToFetch } = req.body as { fieldsToFetch: string[] };

  // If specific fields were requested, build a projection string with allowed fields
  let projection: string | undefined;
  if (fieldsToFetch?.length) {
    const allowed = (fieldsToFetch as string[]).filter((f) =>
      userFields.includes(f)
    );
    if (allowed.length) {
      projection = allowed.join(" ");
    }
  }

  const users = await User.find({}, projection);
  res.status(200).json(users);
});

export const getOrdersByUser = errorWrapper(
  async (req: Request, res: Response) => {
    const { email } = req.user as { email: string };
    const user = await User.findAllOrdersByUser(email);
    res.status(200).json(user);
  }
);

export const requestAccountDeactivation = errorWrapper(
  async (req: Request, res: Response) => {
    const { _id, email, username } = req.user as IUser;

    const user = await User.findById(_id);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (!user.isActive) {
      throw new ApiError("Account is already deactivated", 400);
    }

    if (user.scheduledDeactivationAt) {
      throw new ApiError(
        "Account deactivation is already scheduled. You can cancel it if needed.",
        400
      );
    }

    // Schedule deactivation for 2 days from now
    const deactivationDate = new Date();
    deactivationDate.setDate(deactivationDate.getDate() + 2);

    user.deactivationRequestedAt = new Date();
    user.scheduledDeactivationAt = deactivationDate;
    await user.save({ validateBeforeSave: false });

    const htmlContent = callAccountDeactivationInHtml(username, deactivationDate);
    
    // Send confirmation email
    await sendVerificationEmail(
      email,
      "Account Deactivation Scheduled",
      htmlContent
    );

    res.status(200).json({
      message: "Account deactivation scheduled successfully",
      scheduledDeactivationAt: deactivationDate,
    });
  }
);

export const cancelAccountDeactivation = errorWrapper(
  async (req: Request, res: Response) => {
    const { _id, email, username } = req.user as IUser;

    const user = await User.findById(_id);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (!user.scheduledDeactivationAt) {
      throw new ApiError("No pending account deactivation found", 400);
    }

    // Clear deactivation fields
    user.deactivationRequestedAt = undefined;
    user.scheduledDeactivationAt = undefined;
    await user.save({ validateBeforeSave: false });

    const htmlContent = cancelAccountDeactivationInHtml(username);
    
    // Send confirmation email
    await sendVerificationEmail(
      email,
      "Account Deactivation Cancelled",
      htmlContent
    );

    res.status(200).json({
      message: "Account deactivation cancelled successfully",
    });
  }
);
