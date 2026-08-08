import { Request, Response } from "express";
import { registerUser, loginUser, getMe, updateUserProfile, verifyEmailToken, resendVerificationToken, getBuildingTenants } from "./auth.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { generateToken } from "../../utils/jwt.js";

export async function register(req: Request, res: Response) {
    const result = await registerUser(req.body);

    return res.status(result.success ? 201 : 400).json(result);
}

export async function verifyEmail(req: Request, res: Response) {
    const token = (req.query.token as string) || req.body.token;
    const result = await verifyEmailToken(token);

    return res.status(result.success ? 200 : 400).json(result);
}

export async function resendVerification(req: Request, res: Response) {
    const { email } = req.body;
    const result = await resendVerificationToken(email);

    return res.status(result.success ? 200 : 400).json(result);
}

export async function login(req: Request, res: Response) {
    const result = await loginUser(req.body);

    return res.status(result.success ? 200 : 401).json(result);
}

export async function handleGoogleCallback(req: Request, res: Response) {
    const user = req.user as { _id: string; email: string } | undefined;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!user) {
        return res.redirect(`${frontendUrl}/login?error=Google authentication failed`);
    }

    // Generate NestPay JWT Token for authenticated user
    const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
    });

    // Redirect to frontend callback route with token
    return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
}

export async function getProfile(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await getMe(user.userId);
    return res.status(result.success ? 200 : 404).json(result);
}

export async function updateProfile(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await updateUserProfile(user.userId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function getTenantsDirectory(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orgId = req.query.orgId as string | undefined;
    const result = await getBuildingTenants(user.userId, orgId);
    return res.status(200).json(result);
}