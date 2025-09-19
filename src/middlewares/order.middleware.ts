import { NextFunction, Request, Response } from "express";
import { IUser } from "../types/user.types";
import ApiError from "../utils/apiError";

export const isPhoneVerified = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { isPhoneNoVerified } = req.user as IUser;

  if (!isPhoneNoVerified) {
    return next(new ApiError("Phone number not verified", 403));
  }

  next();
};
