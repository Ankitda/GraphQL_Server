import express from "express";
import multer from "multer";
import {
  createProduct,
  getAllProducts,
  getCategories,
  getProductByCategory,
  getProductById,
  updateManyProducts,
  updateProduct,
  uploadThumbnail,
  editThumbnail,
  deleteThumbnail,
  getThumbnailDetails,
  uploadMultipleImages,
  updateMultipleImages,
} from "../controllers/product.controller";
import { isAdmin } from "../middlewares/product.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.get("/all", getAllProducts);
router.get("/thumbnail", getThumbnailDetails);
router.get("/info", getCategories);
router.get("/:id", getProductById);
router.get("/", getProductByCategory);
router.post("/create", isAdmin, createProduct);
router.put("/:id", isAdmin, updateProduct);
router.put("/bulk-update", isAdmin, updateManyProducts);
router.post(
  "/upload/thumbnail/:id",
  isAdmin,
  upload.single("file"),
  uploadThumbnail
);
router.post("/edit/thumbnail", isAdmin, upload.single("file"), editThumbnail);
router.post(
  "/upload/images",
  isAdmin,
  upload.array("files", 5),
  uploadMultipleImages
);
router.put(
  "/edit/images/:id",
  isAdmin,
  upload.array("files", 5),
  updateMultipleImages
);
router.put("/delete/thumbnail", isAdmin, deleteThumbnail);

export default router;
