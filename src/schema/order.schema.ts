import mongoose, { Schema, Document, Model } from "mongoose";
import { Iitems, IOrder } from "../types/order.types";
import { IUserDocument } from "./user.schema";
import { IProductDocument } from "./product.schema";

export interface IOrderDocument extends Omit<IOrder, "_id">, Document {
  calculateTotal(): Promise<number>;
  canCancel(): boolean;
  getUserDetails(fields: string[]): Promise<IUserDocument | null>;
  getProductDetails(fields: string[]): Promise<IProductDocument | null>;
  getOrderAge(): number;
}

export interface IOrderModel extends Model<IOrderDocument> {
  findByStatus(status: string): Promise<IOrderDocument[]>;
  findUserOrders(userId: string): Promise<IOrderDocument[]>;
}

const addressSchema = new Schema(
  {
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
      minlength: [5, "Street address must be at least 5 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
      trim: true,
      validate: {
        validator: (value: string) => /^\d{5}(-\d{4})?$/.test(value),
        message: "Please enter a valid zip code",
      },
    },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    subtotal: {
      type: Number,
      min: [0, "Subtotal cannot be negative"],
    },
    discount: {
      type: Number,
      min: [0, "Discount cannot be negative"],
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument, IOrderModel>(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    userDetails: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    items: [orderItemSchema],
    payment: {
      method: {
        type: String,
        enum: ["CREDIT_CARD", "DEBIT_CARD", "UPI", "NET_BANKING", "COD"],
        required: true,
      },
      status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"],
        default: "PENDING",
      },
      paidAt: {
        type: Number,
        validate: {
          validator: (val: number) => {
            return Number.isInteger(val) && val.toString().length === 13;
          },
          message: "must be a 13-digit integer (milliseconds).",
        },
      },
      transactionId: String,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    subtotal: {
      type: Number,
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      required: true,
      min: [0, "Tax cannot be negative"],
    },
    shippingCost: {
      type: Number,
      required: true,
      min: [0, "Shipping cost cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    totalAmount: {
      type: Number,
      min: [0, "Total amount cannot be negative"],
    },
    notes: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
    estimatedDeliveryDate: {
      type: Number,
      validate: {
        validator: (val: number) => {
          return Number.isInteger(val) && val.toString().length === 13;
        },
        message: "must be a 13-digit integer (milliseconds).",
      },
    },
    cancelReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  }
);

// Indexes for common queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "payment.status": 1, status: 1 });
orderSchema.index({ "customerInfo.email": 1 });

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const count = (await mongoose.model("Order").countDocuments()) + 1;
    this.orderNumber = `ORD-${year}${month}-${count
      .toString()
      .padStart(6, "0")}`;
  }
  next();
});

orderSchema.pre("save", async function (next) {
  //calculating discount on product
  await this.populate("items.product");
  this.items.forEach((item) => {
    const product = item.product as any;
    if (product.discountPercentage) {
      item.discount = product.discountPercentage;
    }
    item.subtotal = product.price * item.quantity;
  });
  next();
});

// Calculate total before saving
orderSchema.pre("save", function (next) {
  if (this.isModified("items") || this.isNew) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.discount = this.items.reduce((sum, item) => sum + item.discount, 0);
    const discountAmount = Math.floor((this.subtotal * this.discount) / 100);
    const tax = Math.floor((this.subtotal * this.tax) / 100);
    this.totalAmount = this.subtotal + tax + this.shippingCost - discountAmount;
  }
  next();
});

// Method to calculate total
orderSchema.methods.calculateTotal = async function (): Promise<number> {
  await this.populate("items.product");
  return this.items.reduce(
    (total: number, item: { price: number; quantity: number }) =>
      total + item.price * item.quantity,
    0
  );
};

// Method to get user details
orderSchema.methods.getUserDetails = async function (
  fields: string[]
): Promise<IUserDocument | null> {
  await this.populate("userDetails", fields);
  return this.userDetails;
};

// Method to get product details
orderSchema.methods.getProductDetails = async function (
  fields: string[]
): Promise<IProductDocument | null> {
  await this.populate("items.product", fields);
  return this.items.map((item: Iitems) => item.product);
};

// Method to check if order can be cancelled
orderSchema.methods.canCancel = function (): boolean {
  const cancelableStatuses = ["PENDING", "CONFIRMED", "PROCESSING"];
  return cancelableStatuses.includes(this.status);
};

// Method to get order age
orderSchema.methods.getOrderAge = function (): number {
  if (!this.createdAt) return 0;
  return Math.floor(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (
  status: string
): Promise<IOrderDocument[]> {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find user's orders
orderSchema.statics.findUserOrders = function (
  userId: string
): Promise<IOrderDocument[]> {
  return this.find({ userDetails: userId })
    .sort({ createdAt: -1 })
    .populate("items.product");
};

const Order = mongoose.model<IOrderDocument, IOrderModel>("Order", orderSchema);

export default Order;
