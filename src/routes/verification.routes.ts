import express from "express";
import {
  sendVerificationCode,
  verifyAccount,
  verifyPhoneNo,
} from "../controllers/verification.controller";
import { isPhoneNoExists } from "../middlewares/verification.middleware";

const router = express.Router();

router.post("/send-code", isPhoneNoExists, sendVerificationCode);
router.put("/email/verify-account", verifyAccount);
router.put("/phone/verify-phoneNo", verifyPhoneNo);

export default router;
