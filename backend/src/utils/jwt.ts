import jwt from "jsonwebtoken";

export interface TokenPayload {
    userId: string;
    email: string;
}

export function generateToken(payload: TokenPayload, expiresIn: string = "7d"): string {
    const secret = process.env.JWT_SECRET || "fallback_secret";
    return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET || "fallback_secret";
    return jwt.verify(token, secret) as TokenPayload;
}
