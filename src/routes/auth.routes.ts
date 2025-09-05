import express from "express";
import {
  forgotPassword,
  resetPassword,
  userLogin,
} from "../controllers/user.controller";
import { isAccountVerified } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/login", userLogin);
router.post("/forgot-password", isAccountVerified, forgotPassword);
router.put("/reset-password", isAccountVerified, resetPassword);

export default router;
