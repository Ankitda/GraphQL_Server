import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

import { IUser } from "../types/user.types";

// An interface representing a document in MongoDB.
export interface IUserDocument extends Omit<IUser, "_id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(day: number): string;
  generatePasswordResetToken(): string;
}

// A separate interface for statics and tell Mongoose about it when creating the model.
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findAllOrdersByUser(email: string): Promise<IUserDocument | null>;
}

const orderSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    orderNo: {
      type: String,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    username: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      minlength: [5, "Email must be at least 5 characters"],
      maxlength: [225, "Email cannot exceed 225 characters"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phoneNo: {
      type: String,
      match: [/^\+91\d{1,10}$/, "Please enter a valid phone number"],
    },
    accountVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneNoVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Number,
      select: false,
    },
    orders: [orderSchema],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    return next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    throw new Error(
      "Password not found on document. Did you forget to select it?"
    );
  }

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function (day: number): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const options: SignOptions = { expiresIn: day };
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET as string,
    options
  );
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken;
};

//Static Method to find existing user by email
userSchema.statics.findByEmail = function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email });
};

//Static Method to find user Orders
userSchema.statics.findAllOrdersByUser = async function (
  email: string
): Promise<IUserDocument | null> {
  const orders = await this.findOne({ email }).populate("orders.orderId");
  return orders;
};

const User = mongoose.model<IUserDocument, IUserModel>("User", userSchema);

export default User;
