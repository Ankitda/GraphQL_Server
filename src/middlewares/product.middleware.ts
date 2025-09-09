import { Request, Response, NextFunction } from "express";
import { IUser } from "../types/user.types";
import ApiError from "../utils/apiError";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { role }: { role: string } = req.user as IUser;
  if (!role || role !== "ADMIN") {
    return next(new ApiError("Access denied", 403));
  }
  next();
};
