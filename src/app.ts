import express from "express";
import router from "./routes";

const app = express();

app.use(express.json());

// Routes
app.use("/api", router);

export default app;
