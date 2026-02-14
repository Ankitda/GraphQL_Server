import { GraphQLError } from "graphql";
import { IUser } from "../types/user.types";

export const requireAuth = (user: IUser | null) => {
  if (!user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return user;
};