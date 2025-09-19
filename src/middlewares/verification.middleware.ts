import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/apiError";

export const isPhoneNoExists = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { platform } = req.body as { platform: "email" | "phone" };
  const { phoneNo } = req.user as { phoneNo: string };

  if (!platform)
    return next(new ApiError("Platform is required in Body.", 400));

  if (platform === "phone") {
    if (!phoneNo) {
      return next(
        new ApiError(
          "Phone number is required so please check your profile.",
          400
        )
      );
    }
  }
  next();
};
