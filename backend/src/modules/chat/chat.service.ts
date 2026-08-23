import path from "path";
import fs from "fs";
import ChatMessage, { IChatMessage } from "../../models/ChatMessage.js";
import Membership from "../../models/Membership.js";
import Customer from "../../models/Customer.js";
import User from "../../models/User.js";
import Unit from "../../models/Unit.js";
import Notification from "../../models/Notification.js";
import { emitNewChatMessage, emitMessagesRead } from "../../services/socket.js";

export async function verifyUnitChatAccess(userId: string, orgId: string, unitId: string): Promise<{ authorized: boolean; role: "OWNER" | "ADMIN" | "MANAGER" | "TENANT" | "SYSTEM"; userName: string }> {
    // 1. Check Owner / Admin / Manager role
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    const user = await User.findById(userId);
    const userName = user?.name || user?.email?.split("@")[0] || "User";

    if (membership && ["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
        return {
            authorized: true,
            role: membership.role as any,
            userName,
        };
    }

    // 2. Check Tenant occupancy in this unit
    const customer = await Customer.findOne({
        organizationId: orgId,
        unitId,
        userId,
        status: "ACTIVE",
    });

    if (customer) {
        return {
            authorized: true,
            role: "TENANT",
            userName: customer.name || userName,
        };
    }

    // Also check by email/phone fallback
    if (user?.email) {
        const custByEmail = await Customer.findOne({
            organizationId: orgId,
            unitId,
            email: user.email.toLowerCase(),
            status: "ACTIVE",
        });
        if (custByEmail) {
            return {
                authorized: true,
                role: "TENANT",
                userName: custByEmail.name || userName,
            };
        }
    }

    return {
        authorized: false,
        role: "TENANT",
        userName,
    };
}

export async function getUnitChatMessages(userId: string, orgId: string, unitId: string) {
    const { authorized } = await verifyUnitChatAccess(userId, orgId, unitId);
    if (!authorized) {
        return {
            success: false,
            message: "Unauthorized: You do not have permission to view this unit's chat thread.",
        };
    }

    const messages = await ChatMessage.find({ organizationId: orgId, unitId })
        .sort({ createdAt: 1 })
        .limit(200)
        .exec();

    return {
        success: true,
        data: messages,
    };
}

export async function sendUnitChatMessage(
    userId: string,
    orgId: string,
    unitId: string,
    data: {
        text?: string;
        attachments?: Array<{ url: string; fileName?: string; mimeType?: string }>;
        messageType?: "TEXT" | "IMAGE" | "SYSTEM";
    }
) {
    const { authorized, role, userName } = await verifyUnitChatAccess(userId, orgId, unitId);
    if (!authorized) {
        return {
            success: false,
            message: "Unauthorized: You do not have permission to post messages in this unit's chat.",
        };
    }

    const textContent = (data.text || "").trim();
    const attachments = data.attachments || [];
    let msgType = data.messageType || "TEXT";

    if (attachments.length > 0 && msgType === "TEXT") {
        msgType = "IMAGE";
    }

    if (!textContent && attachments.length === 0) {
        return {
            success: false,
            message: "Message content or photo attachment is required.",
        };
    }

    const doc = await ChatMessage.create({
        unitId,
        organizationId: orgId,
        senderId: userId,
        senderName: userName,
        senderRole: role,
        messageType: msgType,
        text: textContent,
        attachments,
        readBy: [userId],
    });

    // Broadcast real-time socket message
    emitNewChatMessage(unitId, doc);

    // Trigger In-App Notifications for offline/other participants of the unit
    triggerChatInAppNotifications(orgId, unitId, userId, userName, textContent || (msgType === "IMAGE" ? "📷 Sent an image attachment" : "New chat message"));

    return {
        success: true,
        data: doc,
    };
}

export async function postSystemChatMessage(
    orgId: string,
    unitId: string,
    systemText: string
) {
    const doc = await ChatMessage.create({
        unitId,
        organizationId: orgId,
        senderName: "System",
        senderRole: "SYSTEM",
        messageType: "SYSTEM",
        text: systemText,
        attachments: [],
        readBy: [],
    });

    // Broadcast real-time socket event
    emitNewChatMessage(unitId, doc);

    return doc;
}

export async function markChatMessagesAsRead(userId: string, orgId: string, unitId: string) {
    const { authorized } = await verifyUnitChatAccess(userId, orgId, unitId);
    if (!authorized) {
        return { success: false, message: "Unauthorized" };
    }

    await ChatMessage.updateMany(
        {
            organizationId: orgId,
            unitId,
            readBy: { $ne: userId },
        },
        {
            $addToSet: { readBy: userId },
        }
    );

    emitMessagesRead(unitId, userId);

    return {
        success: true,
        message: "Messages marked as read",
    };
}

async function triggerChatInAppNotifications(
    orgId: string,
    unitId: string,
    senderUserId: string,
    senderName: string,
    messageText: string
) {
    try {
        const unit = await Unit.findById(unitId);
        const unitLabel = unit ? `Unit ${unit.unitNumber}` : "Unit Chat";

        // Collect recipient user IDs (Owner/Admins + active tenants of unit)
        const recipientUserIds = new Set<string>();

        // 1. Owner & Admins
        const adminMemberships = await Membership.find({
            organizationId: orgId,
            role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
            status: "ACTIVE",
        });
        adminMemberships.forEach((m) => {
            if (String(m.userId) !== String(senderUserId)) {
                recipientUserIds.add(String(m.userId));
            }
        });

        // 2. Tenants of unit
        const tenants = await Customer.find({
            organizationId: orgId,
            unitId,
            status: "ACTIVE",
        });
        tenants.forEach((t) => {
            if (t.userId && String(t.userId) !== String(senderUserId)) {
                recipientUserIds.add(String(t.userId));
            }
        });

        // Create notification docs for each target user
        for (const recipientId of recipientUserIds) {
            await Notification.create({
                userId: recipientId,
                type: "CHAT_MESSAGE",
                title: `💬 New Message in ${unitLabel} (${senderName})`,
                message: messageText.length > 80 ? `${messageText.substring(0, 80)}...` : messageText,
                organizationId: orgId,
                unitId: unitId,
                senderName,
                isRead: false,
            }).catch(() => {});
        }
    } catch (err) {
        console.error("Error dispatching chat in-app notifications:", err);
    }
}
