import express from "express";
import { createOrder, getAllOrders } from "../controllers/order.controller";

const router = express.Router();

router.get("/", getAllOrders);
router.post("/create", createOrder);

export default router;
