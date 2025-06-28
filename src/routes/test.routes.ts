import express from "express";
import { testing } from '../controllers/test.controller';

const router = express.Router();

router.get("/", testing);

export default router;