import express from "express";
import {
  createUser,
  findUserById,
  getAllUsers,
  getOrdersByUser,
  updateUser,
  requestAccountDeactivation,
  cancelAccountDeactivation,
} from "../controllers/user.controller";
import { isAccountVerified } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/find/user", findUserById);
router.get("/find/order", getOrdersByUser);
router.get("/all", getAllUsers);
router.post("/create", createUser);
router.put("/update/user", isAccountVerified, updateUser);
router.post("/deactivate/request", isAccountVerified, requestAccountDeactivation);
router.post("/deactivate/cancel", isAccountVerified, cancelAccountDeactivation);

export default router;
