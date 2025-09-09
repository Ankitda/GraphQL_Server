import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError";
import { IUser } from "../types/user.types";
import User from "../schema/user.schema";
import errorWrapper from "../utils/errorCatching";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const verifyJwtToken = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const paths = ["/graphql", "/api/auth/login", "/api/users/create"];
    if (paths.includes(req.path)) return next();

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError("No token provided", 401);
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      async (err, decoded: any) => {
        if (err) {
          throw new ApiError("Invalid token", 401);
        }
        req.user = (await User.findById(decoded._id)) as IUser;
        next();
      }
    );
  }
);
