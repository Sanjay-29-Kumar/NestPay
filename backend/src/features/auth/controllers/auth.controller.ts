import { Request, Response } from "express";

export const register = async (req: Request, res: Response) => {
    try {
        res.status(201).json({
            success: true,
            message: "Register endpoint is working",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};