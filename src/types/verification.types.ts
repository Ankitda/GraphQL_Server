import { Types } from "mongoose";

export interface IVerification {
  userId: Types.ObjectId;
  verificationNumber: number;
  createdAt: Date;
  expiresAt: Date;
}
