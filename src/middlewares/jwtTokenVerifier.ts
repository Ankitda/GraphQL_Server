import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError";
import { IUser } from "../types/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const verifyJwtToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const paths = ["/graphql", "/api/auth/login", "/api/users/create"];
  if (paths.includes(req.path)) return next();

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError("No token provided", 401);
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      throw new ApiError("Invalid token", 401);
    }
    req.user = decoded as IUser;
    next();
  });
};
