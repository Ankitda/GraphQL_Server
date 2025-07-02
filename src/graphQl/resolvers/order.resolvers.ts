import Order from "../../schema/order.schema";
import Product from "../../schema/product.schema";
import User from "../../schema/user.schema";
import { order } from "../../types/order.types";

export const orderResolvers = {
  Query: {
    orders: async () => await Order.find({}),
  },

  Order: {
    userId: async (parent: order) => await User.findById(parent.userId),
    items: async (parent: order) =>
      await Product.find({ _id: { $in: parent.items } }),
  },
};
