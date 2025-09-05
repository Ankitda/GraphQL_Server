import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/apiError";

export const isAccountVerified = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accountVerified } = req.user as { accountVerified: boolean };

  if (!accountVerified) {
    return next(new ApiError("Account not verified", 403));
  }

  next();
};
