import { Types } from "mongoose";
import { Response, Request } from "express";
import { GraphQLError } from "graphql";
import Order, { IOrderDocument } from "../../schema/order.schema";
import User from "../../schema/user.schema";
import { IOrder, Iitems } from "../../types/order.types";
import { IUser } from "../../types/user.types";
import { requireAuth } from "../../utils/graphqlHelper";

export const orderResolvers = {
  Query: {
    getAllOrders: async (
      parent: any,
      args: any,
      context: {
        req: Request;
        res: Response;
        user: IUser;
      },
    ) => {
      const userContext = requireAuth(context?.user);
      const allOrders = await Order.find({ userDetails: userContext._id });
      return allOrders;
    },

    getOrderById: async (
      parent: any,
      { ordernumber }: { ordernumber: string },
      context: {
        req: Request;
        res: Response;
        user: IUser;
      },
    ) => {
      const userContext = requireAuth(context?.user);
      const order = await Order.findOne({
        orderNumber: ordernumber,
        userDetails: userContext._id,
      });
      if (!order) {
        throw new GraphQLError("Order not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }
      return order;
    },

    getOrdersByStatus: async (
      parent: any,
      { status }: { status: string },
      context: {
        req: Request;
        res: Response;
        user: IUser;
      },
    ) => {
      const userContext = requireAuth(context?.user);
      const orders = await Order.find({ status, userDetails: userContext._id });
      return orders;
    },
  },

  Mutation: {
    createOrder: async (
      parent: any,
      { input }: { input: IOrder },
      context: {
        req: Request;
        res: Response;
        user: IUser;
      },
    ) => {
      const userContext = requireAuth(context?.user);
      const fieldsToCreate = input;
      let orderDetails: IOrder = { ...fieldsToCreate };

      if (orderDetails.items && orderDetails.items.length > 0) {
        orderDetails.items = orderDetails.items.map((item: Iitems) => ({
          ...item,
          product: new Types.ObjectId(item.product),
        }));
      }

      const orderCreated: IOrderDocument = await Order.create(orderDetails);

      if (fieldsToCreate.userDetails) {
        await User.findByIdAndUpdate(fieldsToCreate.userDetails, {
          $push: {
            orders: {
              orderId: orderCreated._id,
              orderNo: orderCreated.orderNumber,
            },
          },
        });
      }

      return orderCreated;
    },

    updateOrder: async (
      parent: any,
      { ordernumber, input }: { ordernumber: string; input: IOrder },
      context: {
        req: Request;
        res: Response;
        user: IUser;
      },
    ) => {
      const userContext = requireAuth(context?.user);
      const fieldsToUpdate = input;
      let orderDetails: IOrder = { ...fieldsToUpdate };

      if (orderDetails.items && orderDetails.items.length > 0) {
        orderDetails.items = orderDetails.items.map((item: Iitems) => ({
          ...item,
          product: new Types.ObjectId(item.product),
        }));
      }

      const order: IOrderDocument | null = await Order.findOneAndUpdate(
        { orderNumber: ordernumber },
        { $set: orderDetails },
        {
          runValidators: true,
          new: true,
        },
      );

      if (!order) {
        throw new GraphQLError("Order not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      return order;
    },
  },
};
