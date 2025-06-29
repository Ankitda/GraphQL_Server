import express from "express";
import productRoutes from './routes/product.routes';
import userRoutes from "./routes/user.routes";
import orderRoutes from "./routes/order.routes";

const router = express.Router();

router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
    
export default router;