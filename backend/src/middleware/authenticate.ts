import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Authentication token missing or invalid",
        });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        (req as AuthenticatedRequest).user = decoded;
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token",
        });
        return;
    }
}
