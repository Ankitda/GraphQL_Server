import { userTypeDefs } from "./types/user.types";
import { productTypeDefs } from "./types/product.types";
import { orderTypeDefs } from "./types/order.types";
import { mergeTypeDefs } from "@graphql-tools/merge";

export const typeDefs = mergeTypeDefs([
  userTypeDefs,
  productTypeDefs,
  orderTypeDefs,
]);
