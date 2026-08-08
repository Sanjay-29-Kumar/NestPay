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

export async function sendWhatsAppTestNotification(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { recipientNumber, message, templateName, organizationId } = req.body;

    if (!recipientNumber) {
        return res.status(400).json({
            success: false,
            message: "Recipient phone number ('recipientNumber') is required.",
        });
    }

    // Membership check if organizationId provided
    if (organizationId) {
        const Membership = (await import("../../models/Membership.js")).default;
        const membership = await Membership.findOne({
            userId: user.userId,
            organizationId,
            status: "ACTIVE",
            role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You do not have permission to send WhatsApp notifications for this organization.",
            });
        }
    }

    const { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } = await import("../../services/whatsapp.provider.js");

    let result;
    if (templateName) {
        result = await sendWhatsAppTemplateMessage({
            to: recipientNumber,
            templateName,
            languageCode: req.body.languageCode || "en_US",
            components: req.body.components || [],
        });
    } else {
        const textMessage = message || "Hello from NestPay! This is a test WhatsApp Business notification.";
        result = await sendWhatsAppTextMessage({
            to: recipientNumber,
            message: textMessage,
        });
    }

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error || "Failed to send WhatsApp message.",
            details: result.metaResponse || null,
        });
    }

    return res.status(200).json({
        success: true,
        message: `WhatsApp test message dispatched to ${recipientNumber} successfully.`,
        messageId: result.messageId,
    });
}

export async function sendRentReminderNotification(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized: Please log in." });

    const { organizationId, tenantPhone, tenantName, rentAmount, unitNumber, dueDate, reminderEvent } = req.body;

    if (!tenantPhone || !tenantName || !rentAmount || !unitNumber || !dueDate) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: tenantPhone, tenantName, rentAmount, unitNumber, dueDate.",
        });
    }

    const { Types } = await import("mongoose");
    const Membership = (await import("../../models/Membership.js")).default;

    let membership = null;
    if (organizationId && Types.ObjectId.isValid(organizationId)) {
        membership = await Membership.findOne({
            userId: user.userId,
            organizationId,
            status: "ACTIVE",
            role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        }).populate("organizationId", "name");
    } else {
        membership = await Membership.findOne({
            userId: user.userId,
            status: "ACTIVE",
            role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        }).populate("organizationId", "name");
    }

    if (!membership) {
        return res.status(403).json({
            success: false,
            message: "Permission Denied: Only Organization Owners, Admins, or Managers can send WhatsApp rent reminders.",
        });
    }

    const orgName = (membership?.organizationId as any)?.name || "NestPay Workspace";

    // Load Organization WhatsApp configuration if custom setup exists
    let config = null;
    if (organizationId && Types.ObjectId.isValid(organizationId)) {
        const WhatsAppConfig = (await import("../../models/WhatsAppConfig.js")).default;
        config = await WhatsAppConfig.findOne({ organizationId, status: "ACTIVE" });
    }

    const { sendWhatsAppTextMessage } = await import("../../services/whatsapp.provider.js");

    const eventPrefix = reminderEvent ? `[Schedule Event: ${reminderEvent}] ` : "";
    const reminderMessage = `${eventPrefix}Hi ${tenantName}, your rent of $${rentAmount} for ${orgName} (Unit ${unitNumber}) is due on ${dueDate}. Please complete payment at your earliest convenience. Thank you!`;

    const result = await sendWhatsAppTextMessage({
        to: tenantPhone,
        message: reminderMessage,
        phoneNumberId: config?.phoneNumberId,
    });

    if (!result.success) {
        let errorReason = result.error || "Failed to dispatch WhatsApp rent reminder.";
        if (errorReason.toLowerCase().includes("access token") || errorReason.toLowerCase().includes("oauth") || errorReason.toLowerCase().includes("expired")) {
            errorReason = "Meta WhatsApp Access Token Expired: Please copy a fresh temporary token from Meta Developer Portal into backend/.env";
        }

        return res.status(400).json({
            success: false,
            message: errorReason,
            details: result.metaResponse || null,
        });
    }

    return res.status(200).json({
        success: true,
        message: `Rent reminder dispatched via WhatsApp to ${tenantName} (${tenantPhone}) successfully.`,
        messageId: result.messageId,
    });
}

export async function triggerBatchCronReminders(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { runDailyRentReminders } = await import("../../services/reminderScheduler.js");
    const summary = await runDailyRentReminders();

    return res.status(200).json({
        success: true,
        message: `Automated daily WhatsApp rent reminder batch executed for Day ${summary.dayOfMonth} (${summary.reminderEvent}).`,
        summary,
    });
}






