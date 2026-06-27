import { Types } from "mongoose";

export interface IThumbnail {
  imageId: string;
  url: string;
  format: string;
}
export interface IReview {
  userDetails: Types.ObjectId;
  rating: number;
  feedback: string;
}
export interface IProduct {
  _id?: string;
  title: string;
  description: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  totalReviews?: number;
  stock: number;
  brand: string;
  category: string;
  subCategory: string;
  thumbnail?: IThumbnail;
  images?: IThumbnail[];
  status: string;
  metadata?: Map<string, string>;
  reviews?: IReview[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
