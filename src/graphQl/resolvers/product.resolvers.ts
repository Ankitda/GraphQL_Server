import Product from "../../schema/product.schema";

export const productResolvers = {
  Query: {
    products: async () => await Product.find({}),
  },
};
