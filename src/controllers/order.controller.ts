import { Request, Response } from "express";
import moongoose from "mongoose";
import errorWrapper from "../utils/errorCatching";
import Order from "../schema/order.schema";
import { order } from "../types/order.types";

export const createOrder = errorWrapper(async (req: Request, res: Response) => {
  let {
    userId,
    firstName,
    lastName,
    address,
    city,
    country,
    zipCode,
    totalAmount,
    items,
  } = req.body as order;

  userId = new moongoose.Types.ObjectId(userId);
  items = items.map((product_Id) => new moongoose.Types.ObjectId(product_Id));

  const orderDetails = {
    userId,
    firstName,
    lastName,
    address,
    city,
    country,
    zipCode,
    totalAmount,
    items,
  };

  const orderCreated = await Order.create({ ...orderDetails });

  res.status(201).json(orderCreated);
});

export const getAllOrders = errorWrapper(
  async (req: Request, res: Response) => {
    const allOrders = await Order.find({});
    res.status(200).json(allOrders);
  }
);
