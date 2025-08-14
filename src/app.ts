import express from "express";
import router from "./routes";
import { verifyJwtToken } from "./middlewares/jwtTokenVerifier";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(verifyJwtToken);

// Routes
app.use("/api", router);

export default app;
