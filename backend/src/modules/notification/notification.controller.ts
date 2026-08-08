import { Request, Response } from "express";
import Notification from "../../models/Notification.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function getUserNotifications(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const notifications = await Notification.find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();

    return res.status(200).json({
        success: true,
        data: notifications,
    });
}

export async function markAsRead(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    await Notification.updateOne({ _id: id, userId: user.userId }, { isRead: true });

    return res.status(200).json({ success: true, message: "Notification marked as read" });
}

export async function markAllAsRead(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    await Notification.updateMany({ userId: user.userId, isRead: false }, { isRead: true });

    return res.status(200).json({ success: true, message: "All notifications marked as read" });
}

