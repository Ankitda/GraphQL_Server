import mongoose, { Schema, Document } from "mongoose";
import { Product } from "../types/product.types";

export interface IProductDocument extends Product, Document {}

export const productSchema = new Schema<IProductDocument>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    required: false,
  },
  stock: {
    type: Number,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: false,
  },
  images: {
    type: String,
    required: false,
  },
});

const Product = mongoose.model<IProductDocument>("Product", productSchema);

export default Product;
