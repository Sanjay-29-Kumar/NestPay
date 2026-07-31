import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("NESTPAY Backend is running...");
});

app.use("/api/v1/auth", authRoutes);

export default app;