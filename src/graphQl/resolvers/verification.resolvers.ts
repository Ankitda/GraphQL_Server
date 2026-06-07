import Verification from "../../schema/verification.schema";
import User from "../../schema/user.schema";
import { requireAuth } from "../../utils/graphqlHelper";
import ApiError from "../../utils/apiError";
import { sendVerificationEmail } from "../../utils/mailHelper";
import { sendMessage } from "../../utils/twilioHelper";
import {
  accountVerificationInHtml,
  verificationCodeInHtml,
} from "../../constants/htmlFormat";

export const verificationResolvers = {
  Query: {
    myVerificationAttempts: async (parent: any, args: any, context: any) => {
      const userContext = requireAuth(context?.user);
      const attempts = await Verification.find({ userId: userContext._id });
      return attempts;
    },
  },

  Mutation: {
    sendVerificationCode: async (
      parent: any,
      { input }: { input: { platform: "EMAIL" | "PHONE" } },
      context: any
    ) => {
      const userContext = requireAuth(context?.user);
      const { _id, email, phoneNo } = userContext;

      // Map platform value to lowercase
      const platform = input.platform.toLowerCase() as "email" | "phone";

      const verificationRecord = await Verification.find({ userId: _id });

      if (verificationRecord.length >= 3) {
        throw new ApiError(
          "You have reached the maximum number of verification attempts. Please try again later after 30 minutes.",
          400
        );
      }

      const verificationCode = new Verification({ userId: _id });
      const generatedCode = verificationCode.generateVerificationCode();
      await verificationCode.save();

      if (platform === "email") {
        const htmlContent = verificationCodeInHtml(generatedCode);
        await sendVerificationEmail(email, "Verify your email", htmlContent);
      } else {
        if (!phoneNo) {
          throw new ApiError("Phone number not found in profile", 400);
        }
        await sendMessage(phoneNo, `Your verification code is: ${generatedCode}`);
      }

      return {
        message: `Verification code sent successfully to ${platform}.`,
      };
    },

    verifyAccount: async (
      parent: any,
      { input }: { input: { code: string } },
      context: any
    ) => {
      const userContext = requireAuth(context?.user);
      const { _id, email, accountVerified } = userContext;
      const { code } = input;

      if (accountVerified) {
        throw new ApiError("Account is already verified.", 400);
      }

      if (!code) {
        throw new ApiError("Verification code is required.", 400);
      }

      const verificationRecord = await Verification.find({ userId: _id });

      if (!verificationRecord || verificationRecord.length === 0) {
        throw new ApiError("No Verification Code is Requested", 400);
      }

      const now = Date.now();
      const expiredDate = new Date(
        verificationRecord[verificationRecord.length - 1].expiresAt
      ).getTime();

      if (now > expiredDate) {
        throw new ApiError("Verification code has expired.", 400);
      }

      const isCodeValid =
        verificationRecord[verificationRecord.length - 1].verifyCode(code);

      if (!isCodeValid) {
        throw new ApiError("Invalid verification code.", 400);
      }

      await User.findByIdAndUpdate(_id, {
        accountVerified: true,
      });

      const verificationMail = accountVerificationInHtml("Account");
      await sendVerificationEmail(email, "Account Verified", verificationMail);

      return { message: "Account verified successfully." };
    },

    verifyPhoneNo: async (
      parent: any,
      { input }: { input: { code: string } },
      context: any
    ) => {
      const userContext = requireAuth(context?.user);
      const { _id, email, isPhoneNoVerified } = userContext;
      const { code } = input;

      if (isPhoneNoVerified) {
        throw new ApiError("Phone number is already verified.", 400);
      }

      if (!code) {
        throw new ApiError("Verification code is required.", 400);
      }

      const verificationRecord = await Verification.find({ userId: _id });

      if (!verificationRecord || verificationRecord.length === 0) {
        throw new ApiError("No Verification Code is Requested", 400);
      }

      const now = Date.now();
      const expiredDate = new Date(
        verificationRecord[verificationRecord.length - 1].expiresAt
      ).getTime();

      if (now > expiredDate) {
        throw new ApiError("Verification code has expired.", 400);
      }

      const isCodeValid =
        verificationRecord[verificationRecord.length - 1].verifyCode(code);

      if (!isCodeValid) {
        throw new ApiError("Invalid verification code.", 400);
      }

      await User.findByIdAndUpdate(_id, {
        isPhoneNoVerified: true,
      });

      const verificationMail = accountVerificationInHtml("Phone Number");
      await sendVerificationEmail(
        email,
        "Phone Number Verified",
        verificationMail
      );

      return { message: "Phone number verified successfully." };
    },
  },
};
