import mongoose, {Schema, Document} from "mongoose";

import { User } from "../types/user.types";

export interface IUserDocument extends User, Document {}

const userSchema = new Schema<IUserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 225,
  },
  password: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 1024,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model<IUserDocument>("User", userSchema);

export default User;