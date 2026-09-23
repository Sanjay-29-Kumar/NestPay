import { Router } from "express";
import passport from "passport";
import { register, verifyEmail, resendVerification, login, getProfile, updateProfile, handleGoogleCallback, getTenantsDirectory } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import { registerSchema, loginSchema, resendVerificationSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", validateRequest(resendVerificationSchema), resendVerification);
router.post("/login", validateRequest(loginSchema), login);
router.get("/me", authenticate, getProfile);
router.put("/me/profile", authenticate, updateProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/building-tenants", authenticate, getTenantsDirectory);

// Google OAuth Routes
router.get("/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/login?error=Google OAuth is not configured on the server`);
    }
    passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

router.get(
    "/google/callback",
    (req, res, next) => {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        passport.authenticate("google", {
            session: false,
            failureRedirect: `${frontendUrl}/login?error=Google authentication failed`,
        })(req, res, next);
    },
    handleGoogleCallback
);

export default router;