import { Router } from "express";
import passport from "passport";
import { register, verifyEmail, resendVerification, login, getProfile, handleGoogleCallback } from "./auth.controller.js";
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

// Google OAuth Routes
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "http://localhost:5173/login?error=Google authentication failed" }),
    handleGoogleCallback
);

export default router;