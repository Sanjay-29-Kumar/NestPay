import { Request, Response } from "express";
import { registerUser } from "./auth.service.js";

export async function register(req: Request, res: Response) {
    const result = await registerUser(req.body);

    return res.status(result.success ? 201 : 400).json(result);
}