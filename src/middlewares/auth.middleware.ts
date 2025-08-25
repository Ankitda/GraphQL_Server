import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/apiError";

export const userEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  const { email: emailField }: any = req.user;

  if (!email || !(email === emailField)) {
    throw new ApiError("Unauthorized user access", 404);
  }

  next();
};
