import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import {
    getUnitChatMessages,
    sendUnitChatMessage,
    markChatMessagesAsRead,
} from "./chat.service.js";

export async function getMessages(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await getUnitChatMessages(user.userId, orgId, unitId);
    return res.status(result.success ? 200 : 403).json(result);
}

export async function sendMessage(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await sendUnitChatMessage(user.userId, orgId, unitId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function markRead(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await markChatMessagesAsRead(user.userId, orgId, unitId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function uploadPhoto(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;

    return res.status(200).json({
        success: true,
        message: "Photo uploaded successfully.",
        data: {
            url: fileUrl,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
        },
    });
}
