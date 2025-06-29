import { Types } from "mongoose";

export interface order {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  country: string;
  zipCode: number;
  totalAmount: number;
  items: Types.ObjectId[];
  createdAt?: Date;
}
