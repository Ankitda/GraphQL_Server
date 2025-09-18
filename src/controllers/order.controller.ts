import { Request, Response } from "express";
import { Types } from "mongoose";
import errorWrapper from "../utils/errorCatching";
import Order from "../schema/order.schema";
import { Iaddress, Iitems, IOrder, Ipayment } from "../types/order.types";
import {
  orderFields,
  orderAddressFields,
  orderItemFields,
  orderPaymentFields,
  userFields,
  productFields,
} from "../constants/docFeilds.constants";
import User from "../schema/user.schema";
import ApiError from "../utils/apiError";

export const createOrder = errorWrapper(async (req: Request, res: Response) => {
  const fieldsToCreate = req.body as Partial<IOrder>;

  let orderDetails: Partial<IOrder> = Object.keys(fieldsToCreate).reduce(
    (acc, key) => {
      if (
        ["items", "shippingAddress", "billingAddress", "payment"].includes(key)
      ) {
        (acc as any)[key] = {};
      } else {
        if (
          orderFields.includes(key) &&
          !["_id", "createdAt", "updatedAt"].includes(key)
        ) {
          (acc as any)[key] = (fieldsToCreate as any)[key];
        }
      }
      return acc;
    },
    {} as Partial<IOrder>
  );

  if (
    Object.hasOwn(fieldsToCreate, "payment") &&
    Object.keys(fieldsToCreate?.payment as Ipayment).length > 0
  ) {
    orderDetails.payment = Object.keys(
      fieldsToCreate?.payment as Ipayment
    ).reduce((acc, key) => {
      if (orderPaymentFields.includes(key)) {
        if (key === "paidAt") {
          (acc as any)[key] = new Date((fieldsToCreate.payment as any)[key]);
        } else {
          (acc as any)[key] = (fieldsToCreate.payment as any)[key];
        }
      }
      return acc;
    }, {} as Ipayment);
  }

  if (
    Object.hasOwn(fieldsToCreate, "shippingAddress") &&
    Object.keys(fieldsToCreate?.shippingAddress as Iaddress).length > 0
  ) {
    orderDetails.shippingAddress = Object.keys(
      fieldsToCreate?.shippingAddress as Iaddress
    ).reduce((acc, key) => {
      if (orderAddressFields.includes(key)) {
        (acc as any)[key] = (fieldsToCreate.shippingAddress as any)[key];
      }
      return acc;
    }, {} as Iaddress);
  }

  if (
    Object.hasOwn(fieldsToCreate, "billingAddress") &&
    Object.keys(fieldsToCreate?.billingAddress as Iaddress).length > 0
  ) {
    orderDetails.billingAddress = Object.keys(
      fieldsToCreate?.billingAddress as Iaddress
    ).reduce((acc, key) => {
      if (orderAddressFields.includes(key)) {
        (acc as any)[key] = (fieldsToCreate.billingAddress as any)[key];
      }
      return acc;
    }, {} as Iaddress);
  }

  if (
    Object.hasOwn(fieldsToCreate, "items") &&
    (fieldsToCreate?.items as Iitems[]).length > 0
  ) {
    orderDetails.items = (fieldsToCreate.items as Iitems[]).map((item) => {
      return Object.keys(item).reduce((acc, key) => {
        if (orderItemFields.includes(key)) {
          if (key === "product") {
            (acc as any)[key] = new Types.ObjectId((item as any)[key]);
          } else {
            (acc as any)[key] = (item as any)[key];
          }
        }
        return acc;
      }, {} as Iitems);
    });
  }

  const orderCreated = await Order.insertOne(orderDetails);

  await User.findByIdAndUpdate(fieldsToCreate.userDetails, {
    $push: {
      orders: {
        orderId: orderCreated._id,
        orderNo: orderCreated.orderNumber,
      },
    },
  });

  res.status(201).json({
    success: true,
    data: orderCreated,
  });
});

export const updateOrder = errorWrapper(async (req: Request, res: Response) => {
  const { ordernumber } = req.params;
  const fieldsToUpdate = req.body as Partial<IOrder>;

  let orderDetails: Partial<IOrder> = Object.keys(fieldsToUpdate).reduce(
    (acc, key) => {
      if (
        ["items", "shippingAddress", "billingAddress", "payment"].includes(key)
      ) {
        (acc as any)[key] = {};
      } else {
        if (
          orderFields.includes(key) &&
          !["_id", "createdAt", "updatedAt"].includes(key)
        ) {
          (acc as any)[key] = (fieldsToUpdate as any)[key];
        }
      }
      return acc;
    },
    {} as Partial<IOrder>
  );

  if (
    Object.hasOwn(fieldsToUpdate, "payment") &&
    Object.keys(fieldsToUpdate?.payment as Ipayment).length > 0
  ) {
    orderDetails.payment = Object.keys(
      fieldsToUpdate?.payment as Ipayment
    ).reduce((acc, key) => {
      if (orderPaymentFields.includes(key)) {
        if (key === "paidAt") {
          (acc as any)[key] = new Date((fieldsToUpdate.payment as any)[key]);
        } else {
          (acc as any)[key] = (fieldsToUpdate.payment as any)[key];
        }
      }
      return acc;
    }, {} as Ipayment);
  }

  if (
    Object.hasOwn(fieldsToUpdate, "shippingAddress") &&
    Object.keys(fieldsToUpdate?.shippingAddress as Iaddress).length > 0
  ) {
    orderDetails.shippingAddress = Object.keys(
      fieldsToUpdate?.shippingAddress as Iaddress
    ).reduce((acc, key) => {
      if (orderAddressFields.includes(key)) {
        (acc as any)[key] = (fieldsToUpdate.shippingAddress as any)[key];
      }
      return acc;
    }, {} as Iaddress);
  }

  if (
    Object.hasOwn(fieldsToUpdate, "billingAddress") &&
    Object.keys(fieldsToUpdate?.billingAddress as Iaddress).length > 0
  ) {
    orderDetails.billingAddress = Object.keys(
      fieldsToUpdate?.billingAddress as Iaddress
    ).reduce((acc, key) => {
      if (orderAddressFields.includes(key)) {
        (acc as any)[key] = (fieldsToUpdate.billingAddress as any)[key];
      }
      return acc;
    }, {} as Iaddress);
  }

  if (
    Object.hasOwn(fieldsToUpdate, "items") &&
    (fieldsToUpdate?.items as Iitems[]).length > 0
  ) {
    orderDetails.items = (fieldsToUpdate.items as Iitems[]).map((item) => {
      return Object.keys(item).reduce((acc, key) => {
        if (orderItemFields.includes(key)) {
          if (key === "product") {
            (acc as any)[key] = new Types.ObjectId((item as any)[key]);
          } else {
            (acc as any)[key] = (item as any)[key];
          }
        }
        return acc;
      }, {} as Iitems);
    });
  }

  const order = await Order.findOneAndUpdate(
    { orderNumber: ordernumber },
    orderDetails,
    {
      runValidators: true,
      new: true,
    }
  );

  if (!order) {
    throw new ApiError("Order not found", 404);
  }

  res.status(200).json(order);
});

export const getOrderById = errorWrapper(
  async (req: Request, res: Response) => {
    const { ordernumber } = req.params;
    const { fieldsToFetch, userField, productField } = req.body;

    const fieldsForUser = userField?.filter((field: string) =>
      userFields.includes(field)
    );

    const fieldsForProduct = productField?.filter((field: string) =>
      productFields.includes(field)
    );

    const projectedFields = fieldsToFetch?.reduce((acc: any, field: string) => {
      if (orderFields.includes(field)) {
        (acc as any)[field] = 1;
      }
      return acc;
    }, {});

    const order = await Order.findOne(
      { orderNumber: ordernumber },
      projectedFields
    );

    if (
      fieldsForUser?.length > 0 &&
      Object.hasOwn(projectedFields, "userDetails")
    ) {
      await order?.getUserDetails(fieldsForUser);
    }

    if (
      fieldsForProduct?.length > 0 &&
      Object.hasOwn(projectedFields, "items")
    ) {
      await order?.getProductDetails(fieldsForProduct);
    }

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    res.status(200).json(order);
  }
);

export const getOrdersByStatus = errorWrapper(
  async (req: Request, res: Response) => {
    const { status } = req.params;
    const { ismetadataneeded } = req.query;
    const { fieldsToFetch, userField, productField } = req.body;

    const projectionFields = fieldsToFetch?.reduce(
      (acc: any, field: string) => {
        if (orderFields.includes(field)) {
          (acc as any)[field] = 1;
        }
        return acc;
      },
      {}
    );

    const fieldsForUser = userField?.filter((field: string) =>
      userFields.includes(field)
    );

    const fieldsForProduct = productField?.filter((field: string) =>
      productFields.includes(field)
    );

    let orders = [] as any[];

    if (ismetadataneeded === "true") {
      orders = await Order.find({ status }, projectionFields)
        .populate("userDetails", fieldsForUser)
        .populate("items.product", fieldsForProduct)
        .exec();
    } else {
      orders = await Order.find({ status }, projectionFields);
    }

    if (orders?.length === 0) {
      return res.status(200).json({
        message: `No ${
          status.charAt(0) + status.slice(1).toLowerCase()
        } orders found`,
      });
    } else {
      return res.status(200).json(orders);
    }
  }
);

export const getAllOrders = errorWrapper(
  async (req: Request, res: Response) => {
    const { fieldsToFetch } = req.body;

    const projectFields = fieldsToFetch?.reduce((acc: any, field: string) => {
      if (orderFields.includes(field)) {
        (acc as any)[field] = 1;
      }
      return acc;
    }, {});

    const allOrders: IOrder[] = await Order.find({}, projectFields);

    res.status(200).json(allOrders);
  }
);
