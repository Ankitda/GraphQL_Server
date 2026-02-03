import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "../types";
import { resolvers } from "../resolver";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../../schema/user.schema";
import DateScalar from "../scalartypes/DateScalar";
import { IUser } from "../../types/user.types";

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers: {
    Date: DateScalar,
    ...resolvers,
  },
  context: async ({ req, res }: { req: Request; res: Response }) => {
    let user: IUser | null = null;
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as IUser;
        if (decoded && decoded._id) {
            user = await User.findById(decoded._id);
        }
      } catch (err) {
        console.log("Token invalid or expired. User remains null.", err);
      }
    }

    return { req, res, user };
  },
});

export default apolloServer;
