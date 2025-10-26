import { Types } from "mongoose";

export interface Iaddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Iitems {
  product: Types.ObjectId;
  quantity: number;
  subtotal: number;
  discount: number;
}

export interface Ipayment {
  method: string;
  status: string;
  transactionId?: string;
  paidAt?: Date;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  userDetails: Types.ObjectId;
  shippingAddress: Iaddress;
  billingAddress: Iaddress;
  items: Iitems[];
  payment: Ipayment;
  status: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  cancelReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
