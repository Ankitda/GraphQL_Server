import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrdersByStatus,
  getOrderById,
  updateOrder,
} from "../controllers/order.controller";
import { isPhoneVerified } from "../middlewares/order.middleware";
import { isAccountVerified } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/create", isAccountVerified, isPhoneVerified, createOrder);
router.put("/:ordernumber", isAccountVerified, isPhoneVerified, updateOrder);
router.get("/all", getAllOrders);
router.get("/:ordernumber", getOrderById);
router.get("/status/:status", getOrdersByStatus);

export default router;
