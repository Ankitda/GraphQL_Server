import mongoose, { Schema, Document, Model, ProjectionType } from "mongoose";
import { IProduct } from "../types/product.types";

export interface IProductDocument extends Omit<IProduct, "_id">, Document {
  isInStock(): boolean;
  calculateDiscountedPrice(): number;
}

export interface IProductModel extends Model<IProductDocument> {
  findByCategory(
    category: string,
    projectedFields?: ProjectionType<IProductDocument>,
  ): Promise<IProductDocument[]>;
}

export const thumbnailSchema = new Schema(
  {
    imageId: {
      type: String,
    },
    url: {
      type: String,
      validate: {
        validator: (value: string) => {
          if (!value) return true; // Allow empty
          return /^https?:\/\/.+/.test(value);
        },
        message: "Please provide a valid URL for thumbnail",
      },
    },
    format: {
      type: String,
    },
  },
  {
    _id: false,
  },
);

export const reviewSchema = new Schema(
  {
    userDetails: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    feedback: {
      type: String,
      required: [true, "Feedback is required"],
    },
  },
  {
    _id: false,
  },
);

export const productSchema = new Schema<IProductDocument, IProductModel>(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: (value: number) => value >= 0,
        message: "Price must be a positive number",
      },
    },
    discountPercentage: {
      type: Number,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
      default: 0,
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    subCategory: {
      type: String,
      required: [true, "Subcategory is required"],
      trim: true,
      index: true,
    },
    thumbnail: thumbnailSchema,
    images: [thumbnailSchema],
    reviews: [reviewSchema],
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "OUT_OF_STOCK", "DISCONTINUED"],
      default: "draft",
    },
    metadata: {
      type: Object,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  },
);

// Create compound indexes for common queries
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ price: 1, discountPercentage: 1 });

// Create text index for search
productSchema.index({
  title: "text",
  description: "text",
  brand: "text",
  category: "text",
});

// Method to check if product is in stock
productSchema.methods.isInStock = function (): boolean {
  return this.stock > 0 && this.status === "published";
};

// Method to calculate discounted price
productSchema.methods.calculateDiscountedPrice = function (): number {
  if (!this.discountPercentage) return 0;
  const discount = (this.price * this.discountPercentage) / 100;
  return Number((this.price - discount).toFixed(2));
};

// Static method to find products by category
productSchema.statics.findByCategory = function (
  category: string,
  projectedFields?: ProjectionType<IProductDocument>,
): Promise<IProductDocument[]> {
  return this.find({ category, isActive: true }, projectedFields).sort({
    createdAt: -1,
  });
};

// Pre-save hook to calculate rating and totalReviews based on reviews
productSchema.pre("save", function (next) {
  if (this.isModified("reviews")) {
    if (this.reviews && this.reviews.length > 0) {
      this.totalReviews = this.reviews.length;
      const sum = this.reviews.reduce(
        (acc, review) => acc + (review.rating || 0),
        0,
      );
      this.rating = Number.parseFloat((sum / this.reviews.length).toFixed(1));
    } else {
      this.totalReviews = 0;
      this.rating = 0;
    }
  }
  next();
});

const Product = mongoose.model<IProductDocument, IProductModel>(
  "Product",
  productSchema,
);

export default Product;
