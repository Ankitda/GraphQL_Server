import { Request, Response } from "express";
import errorWrapper from "../utils/errorCatching";
import { sendVerificationEmail } from "../utils/mailHelper";
import Verification from "../schema/verification.schema";
import {
  accountVerificationInHtml,
  verificationCodeInHtml,
} from "../constants/htmlFormat";
import ApiError from "../utils/apiError";
import User from "../schema/user.schema";
import { IUser } from "../types/user.types";
import { sendMessage } from "../utils/twilioHelper";

export const sendVerificationCode = errorWrapper(
  async (req: Request, res: Response) => {
    const { platform } = req.body as { platform: "email" | "phone" };
    const { _id, email, phoneNo } = req.user as IUser;

    const verificationRecord = await Verification.find({ userId: _id });

    if (verificationRecord.length >= 3) {
      return res.status(400).json({
        message:
          "You have reached the maximum number of verification attempts. Please try again later after 30 minutes.",
      });
    }

    const verificationCode = new Verification({ userId: _id });

    const generatedCode = verificationCode.generateVerificationCode();

    await verificationCode.save();

    if (platform === "email") {
      const htmlContent = verificationCodeInHtml(generatedCode);

      // Send the verification email
      await sendVerificationEmail(email, "Verify your email", htmlContent);
    } else {
      // Send the verification SMS
      await sendMessage(phoneNo, `Your verification code is: ${generatedCode}`);
    }

    res
      .status(200)
      .json({ message: `Verification code sent successfully to ${platform}.` });
  }
);

export const verifyAccount = errorWrapper(
  async (req: Request, res: Response) => {
    const { code } = req.body as { code: string };
    const { _id, email, accountVerified } = req.user as IUser;

    if (accountVerified)
      throw new ApiError("Account is already verified.", 400);

    if (!code) throw new ApiError("Verification code is required.", 400);

    // Find the verification record
    const verificationRecord = await Verification.find({ userId: _id });

    if (!verificationRecord || verificationRecord.length === 0)
      throw new ApiError("No Verification Code is Requested", 400);

    const now = Date.now();
    const expiredDate = new Date(
      verificationRecord[verificationRecord.length - 1].expiresAt
    ).getTime();

    if (now > expiredDate)
      throw new ApiError("Verification code has expired.", 400);

    // Check if the code matches
    const isCodeValid =
      verificationRecord[verificationRecord.length - 1].verifyCode(code);

    if (!isCodeValid) throw new ApiError("Invalid verification code.", 400);

    // If valid, mark the account as verified
    await User.findByIdAndUpdate(_id, {
      accountVerified: true,
    });

    const verificationMail = accountVerificationInHtml("Account");
    await sendVerificationEmail(email, "Account Verified", verificationMail);

    res.status(200).json({ message: "Account verified successfully." });
  }
);

export const verifyPhoneNo = errorWrapper(
  async (req: Request, res: Response) => {
    const { code } = req.body as { code: string };
    const { _id, email, isPhoneNoVerified } = req.user as IUser;

    if (isPhoneNoVerified)
      throw new ApiError("Phone number is already verified.", 400);

    if (!code) throw new ApiError("Verification code is required.", 400);

    // Find the verification record
    const verificationRecord = await Verification.find({ userId: _id });

    if (!verificationRecord || verificationRecord.length === 0)
      throw new ApiError("No Verification Code is Requested", 400);

    const now = Date.now();
    const expiredDate = new Date(
      verificationRecord[verificationRecord.length - 1].expiresAt
    ).getTime();

    if (now > expiredDate)
      throw new ApiError("Verification code has expired.", 400);

    // Check if the code matches
    const isCodeValid =
      verificationRecord[verificationRecord.length - 1].verifyCode(code);

    if (!isCodeValid) throw new ApiError("Invalid verification code.", 400);

    // If valid, mark the phone number as verified
    await User.findByIdAndUpdate(_id, {
      isPhoneNoVerified: true,
    });

    const verificationMail = accountVerificationInHtml("Phone Number");
    await sendVerificationEmail(
      email,
      "Phone Number Verified",
      verificationMail
    );

    res.status(200).json({ message: "Phone number verified successfully." });
  }
);
