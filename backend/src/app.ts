import express from "express";
import cors from "cors";
import passport from "passport";
import { configurePassport } from "./config/passport.js";
import authRoutes from "./modules/auth/auth.routes.js";
import organizationRoutes from "./modules/organization/organization.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Passport for Google OAuth
app.use(passport.initialize());
configurePassport();

app.get("/", (req, res) => {
    res.send("NESTPAY Backend is running...");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/notifications", notificationRoutes);

export default app;