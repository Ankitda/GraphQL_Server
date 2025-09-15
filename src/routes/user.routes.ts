import express from "express";
import {
  createUser,
  findUserById,
  getAllUsers,
  getOrdersByUser,
  updateUser,
} from "../controllers/user.controller";
import { isAccountVerified } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/find/user", findUserById);
router.get("/find/order", getOrdersByUser);
router.get("/all", getAllUsers);
router.post("/create", createUser);
router.put("/update/user", isAccountVerified, updateUser);

export default router;
