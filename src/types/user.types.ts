import { Types } from "mongoose";

export interface IOrder {
  orderId: Types.ObjectId;
  orderNo: string;
}
export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  phoneNo: string;
  isPhoneNoVerified: boolean;
  resetPasswordToken: string;
  resetPasswordExpires: number;
  accountVerified: boolean;
  role: "USER" | "ADMIN";
  isActive: boolean;
  orders?: IOrder[]; // array of orders
  createdAt?: Date;
  updatedAt?: Date;
}
