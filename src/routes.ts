import express from "express";
import productRoutes from "./routes/product.routes";
import userRoutes from "./routes/user.routes";
import orderRoutes from "./routes/order.routes";
import authRoutes from "./routes/auth.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

export default router;
