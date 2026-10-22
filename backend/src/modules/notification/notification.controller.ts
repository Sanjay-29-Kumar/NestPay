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
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in with a valid JWT token.",
        });
    }

    const { phoneNumber, recipientNumber, message, templateName, organizationId, languageCode, components } = req.body;
    const targetPhone = phoneNumber || recipientNumber;

    if (!targetPhone) {
        return res.status(400).json({
            success: false,
            message: "Recipient phone number ('phoneNumber') is required.",
            error: {
                code: "MISSING_PHONE_NUMBER",
                message: "Please provide a valid recipient phone number in 'phoneNumber'.",
            },
        });
    }

    // Role-based Access Control (RBAC): Restricted to Owner/Admin/Manager roles
    const Membership = (await import("../../models/Membership.js")).default;
    const membershipQuery: Record<string, any> = {
        userId: user.userId,
        status: "ACTIVE",
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
    };
    if (organizationId) {
        membershipQuery.organizationId = organizationId;
    }

    const authorizedMembership = await Membership.findOne(membershipQuery);

    if (!authorizedMembership) {
        return res.status(403).json({
            success: false,
            message: "Access Denied: Only property Owners, Administrators, and Managers are authorized to dispatch WhatsApp messages.",
            error: {
                code: "FORBIDDEN_ROLE",
                message: "User does not hold an OWNER, ADMIN, or MANAGER role.",
            },
        });
    }

    const { sendTextMessage, sendTemplateMessage } = await import("../../services/whatsapp.service.js");

    let result;
    if (templateName) {
        result = await sendTemplateMessage(targetPhone, templateName, {
            languageCode: languageCode || "en_US",
            components: components || [],
            organizationId,
        });
    } else {
        const textContent = message || "Hello from NESTPAY WhatsApp integration!";
        result = await sendTextMessage(targetPhone, textContent, {
            organizationId,
        });
    }

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error?.message || "Failed to send WhatsApp message.",
            error: result.error || {
                code: "META_DISPATCH_FAILED",
                message: "Failed to dispatch WhatsApp message via Meta Cloud API.",
            },
        });
    }

    return res.status(200).json({
        success: true,
        message: "WhatsApp message sent successfully",
        data: {
            messageId: result.messageId,
        },
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

export async function sendInAppMessage(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { title, message, organizationId, unitId, senderName } = req.body;
    if (!message) {
        return res.status(400).json({ success: false, message: "Message content is required." });
    }

    const User = (await import("../../models/User.js")).default;
    const senderUser = await User.findById(user.userId);

    const doc = await Notification.create({
        userId: user.userId,
        title: title || "In-App Message",
        message,
        type: "IN_APP_MESSAGE",
        organizationId: organizationId || null,
        unitId: unitId || null,
        senderName: senderName || senderUser?.name || "User",
        isRead: true,
    });

    return res.status(201).json({
        success: true,
        message: "Message sent successfully.",
        data: doc,
    });
}

export async function getUnitInAppMessages(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { unitId, organizationId } = req.query;

    const query: Record<string, any> = { type: "IN_APP_MESSAGE" };
    if (organizationId) query.organizationId = organizationId;
    if (unitId) query.unitId = unitId;

    const messages = await Notification.find(query)
        .sort({ createdAt: 1 })
        .limit(100)
        .exec();

    return res.status(200).json({
        success: true,
        data: messages,
    });
}

export async function logManualWhatsAppSend(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { organizationId, unitId, tenantName, phone, amount, dueDate, dayRule, notificationId } = req.body;
    if (!organizationId || !unitId) {
        return res.status(400).json({ success: false, message: "organizationId and unitId are required." });
    }

    const ReminderLog = (await import("../../models/ReminderLog.js")).default;
    const logDoc = await ReminderLog.create({
        organizationId,
        unitId,
        sentAt: new Date(),
        channels: ["WhatsApp (Manual)"],
        recipients: [
            {
                name: tenantName || "Tenant",
                phone: phone || "",
                email: "",
                role: "Tenant",
            },
        ],
        dayRule: dayRule || "Manual WhatsApp Send",
        messageType: "REMINDER",
        amount: Number(amount) || 0,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        status: "SUCCESS",
        details: `Owner clicked Send via WhatsApp to ${tenantName || "Tenant"} (${phone || "N/A"}).`,
    });

    if (notificationId) {
        await Notification.updateOne(
            { _id: notificationId },
            { isRead: true, "metadata.actionStatus": "SENT" }
        ).catch(() => {});
    }

    return res.status(200).json({
        success: true,
        message: "Manual WhatsApp send recorded in reminder log successfully.",
        data: logDoc,
    });
}







