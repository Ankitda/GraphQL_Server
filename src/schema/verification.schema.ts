import mongoose, { Schema, Document } from "mongoose";
import { IVerification } from "../types/verification.types";
import crypto from "crypto";

export interface IVerificationDocument extends IVerification, Document {
  generateVerificationCode(): string;
  verifyCode(code: string): boolean;
}

const verificationSchema = new Schema<IVerificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    verificationNumber: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

verificationSchema.methods.generateVerificationCode = function (): string {
  const verificationCode = crypto.randomBytes(2).toString("hex");
  this.verificationNumber = parseInt(verificationCode, 16);
  this.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  return verificationCode;
};

verificationSchema.methods.verifyCode = function (code: string): boolean {
  return this.verificationNumber === parseInt(code, 16);
};

const Verification = mongoose.model<IVerificationDocument>(
  "Verification",
  verificationSchema
);

export default Verification;
