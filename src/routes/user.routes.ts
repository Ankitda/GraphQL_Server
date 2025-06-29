import express from "express";
import { createUser, getAllUsers } from '../controllers/user.controller';

const router = express.Router();

router.get("/", getAllUsers);
router.post("/create", createUser);

export default router;