import express from "express";
import cors from "cors";
import passport from "passport";
import { configurePassport } from "./config/passport.js";
import authRoutes from "./modules/auth/auth.routes.js";
import organizationRoutes from "./modules/organization/organization.routes.js";
import memberRoutes from "./modules/members/members.routes.js";
import propertyRoutes from "./modules/properties/properties.routes.js";
import unitRoutes from "./modules/units/units.routes.js";
import customerRoutes from "./modules/customers/customers.routes.js";
import documentRoutes from "./modules/documents/documents.routes.js";
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
app.use("/api/v1/organizations/:orgId/members", memberRoutes);
app.use("/api/v1/organizations/:orgId/properties", propertyRoutes);
app.use("/api/v1/organizations/:orgId/units", unitRoutes);
app.use("/api/v1/organizations/:orgId/customers", customerRoutes);
app.use("/api/v1/organizations/:orgId/documents", documentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

export default app;