import express from "express";
import productRoutes from './routes/product.routes';
import testingRoutes from './routes/test.routes';

const router = express.Router();

router.use("/test", testingRoutes);
router.use("/products", productRoutes);
    
export default router;