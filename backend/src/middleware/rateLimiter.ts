import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate.js";

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

/**
 * Creates an in-memory sliding window rate limiter middleware.
 * @param maxRequests Maximum requests allowed within windowMs
 * @param windowMs Time window in milliseconds (e.g., 60,000 for 1 min)
 */
export function rateLimiter(maxRequests: number = 10, windowMs: number = 60000) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const userId = (req as AuthenticatedRequest).user?.userId;
        const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
        const key = userId ? `user_${userId}` : `ip_${ip}`;

        const now = Date.now();
        const record = store[key];

        if (!record || now > record.resetTime) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs,
            };
            next();
            return;
        }

        if (record.count >= maxRequests) {
            const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
            res.setHeader("Retry-After", retryAfterSec);
            res.status(429).json({
                success: false,
                message: `Rate limit exceeded. Too many test requests. Please wait ${retryAfterSec} seconds before trying again.`,
            });
            return;
        }

        record.count += 1;
        next();
    };
}
