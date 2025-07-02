import { userResolvers } from "./resolvers/user.resolvers";
import { productResolvers } from "./resolvers/product.resolvers";
import { orderResolvers } from "./resolvers/order.resolvers";
import { mergeResolvers } from "@graphql-tools/merge";

export const resolvers = mergeResolvers([
  userResolvers,
  productResolvers,
  orderResolvers,
]);
