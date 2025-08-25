import express from "express";
import { resetPassword, userLogin } from "../controllers/user.controller";
import { userEmailVerification } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/login", userLogin);
router.put("/reset-password", userEmailVerification, resetPassword);

export default router;
