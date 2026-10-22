import Customer, { ICustomer } from "../models/Customer.js";
import Unit from "../models/Unit.js";
import Organization from "../models/Organization.js";
import Notification from "../models/Notification.js";
import WhatsAppConfig from "../models/WhatsAppConfig.js";
import ReminderLog from "../models/ReminderLog.js";
import PaymentConfirmationLog from "../models/PaymentConfirmationLog.js";
import { sendWhatsAppTextMessage } from "./whatsapp.provider.js";
import { sendEmail } from "./email.service.js";

export interface DispatchOptions {
    organizationId: string;
    unitId: string;
    invoiceId?: string;
    paymentId?: string;
    recipients: "PRIMARY" | "ALL";
    messageType: "REMINDER" | "AMOUNT_SET" | "AMOUNT_CHANGED" | "PAYMENT_CONFIRMED" | "MANUAL_ISSUE";
    amount: number;
    dueDate: Date | string;
    billingPeriod: string;
    dayRuleLabel?: string;
    paymentMode?: string;
}

export interface DispatchResult {
    success: boolean;
    totalRecipients: number;
    dispatchedCount: number;
    failedCount: number;
    isBusinessAccount?: boolean;
    requiresManualWhatsApp?: boolean;
    details: Array<{
        name: string;
        phone: string;
        email: string;
        status: "SUCCESS" | "FAILED";
        error?: string;
    }>;
}

export async function dispatchMultiChannelNotification(
    options: DispatchOptions
): Promise<DispatchResult> {
    const {
        organizationId,
        unitId,
        invoiceId,
        paymentId,
        recipients,
        messageType,
        amount,
        dueDate,
        billingPeriod,
        dayRuleLabel,
        paymentMode = "App",
    } = options;

    const unit = await Unit.findById(unitId);
    if (!unit) {
        throw new Error("Unit not found for dispatch.");
    }

    const org = await Organization.findById(organizationId);
    const orgName = org?.name || "NestPay Property Management";

    // Fetch active customers assigned to unit
    const customers = await Customer.find({
        organizationId,
        unitId,
        status: "ACTIVE",
    });

    if (customers.length === 0) {
        return {
            success: true,
            totalRecipients: 0,
            dispatchedCount: 0,
            failedCount: 0,
            isBusinessAccount: false,
            requiresManualWhatsApp: false,
            details: [],
        };
    }

    // Determine target recipient list
    let targetCustomers: ICustomer[] = [];
    if (recipients === "PRIMARY") {
        // Primary tenant: Family Head, Single, Sharing head, or familyHeadId null
        const primary = customers.filter(
            (c) =>
                !c.familyHeadId ||
                c.occupancyRole === "Family Head" ||
                c.occupancyRole === "Single"
        );
        targetCustomers = primary.length > 0 ? primary : [customers[0]];
    } else {
        // All tenants (Primary + Family/Sharing)
        targetCustomers = customers;
    }

    // Check custom WhatsApp config
    const orgWhatsAppConfig = await WhatsAppConfig.findOne({
        organizationId,
        status: "ACTIVE",
    });

    // Check if Business Account:
    // Organization has configured WhatsApp Cloud API (or system has global Meta credentials configured)
    const isBusinessAccount = Boolean(
        (orgWhatsAppConfig &&
            orgWhatsAppConfig.status === "ACTIVE" &&
            orgWhatsAppConfig.phoneNumberId &&
            orgWhatsAppConfig.businessAccountId) ||
        (process.env.WHATSAPP_PHONE_NUMBER_ID &&
            process.env.WHATSAPP_BUSINESS_ACCOUNT_ID &&
            process.env.WHATSAPP_ACCESS_TOKEN &&
            (!orgWhatsAppConfig || orgWhatsAppConfig.status === "ACTIVE"))
    );

    const formattedDueDate =
        typeof dueDate === "string"
            ? dueDate
            : new Date(dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
              });

    let dayRuleText = dayRuleLabel || "Payment Scheduled Reminder";
    if (messageType === "AMOUNT_SET" || messageType === "AMOUNT_CHANGED") {
        dayRuleText = dayRuleLabel || "Bill Established";
    }
    if (messageType === "MANUAL_ISSUE") dayRuleText = "Manual Payment Demand Issued";
    if (messageType === "PAYMENT_CONFIRMED") dayRuleText = "Payment Received Confirmation";

    const dispatchDetails: DispatchResult["details"] = [];
    let dispatchedCount = 0;
    let failedCount = 0;

    for (const customer of targetCustomers) {
        let subject = "";
        let bodyMessage = "";

        if (messageType === "PAYMENT_CONFIRMED") {
            subject = `Payment Received Confirmation — Unit ${unit.unitNumber} (${billingPeriod})`;
            bodyMessage = `Hi ${customer.name}, we have received your payment of ₹${amount.toLocaleString()} for Unit ${
                unit.unitNumber
            } (${billingPeriod}) via ${paymentMode}. Thank you! Status: PAID.`;
        } else if (messageType === "AMOUNT_SET" || messageType === "AMOUNT_CHANGED") {
            subject = `Rent Demand Notice — Unit ${unit.unitNumber} (${billingPeriod})`;
            bodyMessage = `Hi ${customer.name}, the rent amount for Unit ${
                unit.unitNumber
            } (${billingPeriod}) has been ${
                messageType === "AMOUNT_SET" ? "set" : "updated"
            } to ₹${amount.toLocaleString()}. Payment Due Date: ${formattedDueDate}.`;
        } else if (messageType === "MANUAL_ISSUE") {
            subject = `Payment Demand Issued — Unit ${unit.unitNumber} (${billingPeriod})`;
            bodyMessage = `Hi ${customer.name}, payment demand of ₹${amount.toLocaleString()} for Unit ${
                unit.unitNumber
            } (${billingPeriod}) is due on ${formattedDueDate}. Please settle at your earliest convenience.`;
        } else {
            // REMINDER
            subject = `Payment Reminder (${dayRuleText}) — Unit ${unit.unitNumber}`;
            bodyMessage = `[${dayRuleText}] Hi ${customer.name}, your rent payment of ₹${amount.toLocaleString()} for Unit ${
                unit.unitNumber
            } (${orgName}) for ${billingPeriod} is due on ${formattedDueDate}. Thank you!`;
        }

        let customerSuccess = true;

        const ownerName = org?.emailSenderConfig?.senderName || org?.name || "Property Owner";
        const ownerEmail = org?.emailSenderConfig?.senderEmail || org?.email;
        const replyTo = org?.emailSenderConfig?.replyToEmail || ownerEmail;

        // 1. WhatsApp Dispatch:
        // Rule:
        // - If Business Account: automated Meta Cloud API call is performed.
        // - If NOT a Business Account: automated API call is skipped (manual dispatch required).
        if (isBusinessAccount && customer.phone) {
            const finalWhatsAppMessage = orgWhatsAppConfig
                ? bodyMessage
                : `Sent on behalf of ${ownerName} — ${orgName}:\n\n${bodyMessage}`;

            await sendWhatsAppTextMessage({
                to: customer.phone,
                message: finalWhatsAppMessage,
                phoneNumberId: orgWhatsAppConfig?.phoneNumberId,
            }).catch((err) => {
                console.error("Automated WhatsApp dispatch error:", err);
            });
        }

        // 2. In-App Notification
        if (customer.userId) {
            await Notification.create({
                userId: customer.userId,
                type: messageType === "PAYMENT_CONFIRMED" ? "PAYMENT_CONFIRMATION" : "PAYMENT_REMINDER",
                title: subject,
                message: bodyMessage,
                isRead: false,
            }).catch(() => {});
        }

        // 3. Email Dispatch
        if (customer.email) {
            await sendEmail({
                to: customer.email,
                subject,
                text: bodyMessage,
                fromName: `${ownerName} (${orgName})`,
                fromEmail: ownerEmail,
                replyTo: replyTo || undefined,
            }).catch(() => {});
        }

        // 4. Notify Organization Owner & Admins in In-App Notification Area with WhatsApp Action
        // Rule:
        // - If Business Account: BOTH has to be done (automated dispatched above AND owner gets manual action)
        // - If NOT Business Account: Manual MUST happen (owner is notified to send via WhatsApp Web/Desktop)
        if (messageType === "REMINDER" || messageType === "AMOUNT_SET" || messageType === "MANUAL_ISSUE") {
            try {
                const Membership = (await import("../models/Membership.js")).default;
                const ownerMemberships = await Membership.find({
                    organizationId,
                    role: { $in: ["OWNER", "ADMIN"] },
                    status: "ACTIVE",
                });
                const ownerUserIds = new Set<string>();
                if (org?.ownerId) ownerUserIds.add(String(org.ownerId));
                for (const om of ownerMemberships) {
                    if (om.userId) ownerUserIds.add(String(om.userId));
                }

                const actionSubTitle = isBusinessAccount
                    ? `[Automated & Manual] Reminder queued for ${customer.name} (Unit ${unit.unitNumber}, ₹${amount.toLocaleString()}). Tap to preview and re-send via WhatsApp.`
                    : `[Personal WhatsApp] Reminder ready for ${customer.name} (Unit ${unit.unitNumber}, ₹${amount.toLocaleString()}). Tap to preview and send via WhatsApp.`;

                for (const ownerUid of ownerUserIds) {
                    await Notification.create({
                        userId: ownerUid,
                        type: "MANUAL_WHATSAPP_ACTION",
                        title: `💬 WhatsApp Reminder: Unit ${unit.unitNumber} (${customer.name})`,
                        message: actionSubTitle,
                        organizationId,
                        unitId,
                        metadata: {
                            tenantName: customer.name,
                            tenantPhone: customer.phone,
                            rentAmount: amount,
                            unitNumber: unit.unitNumber,
                            dueDate: formattedDueDate,
                            billingPeriod,
                            prefilledMessage: bodyMessage,
                            dayRule: dayRuleText,
                            actionStatus: "PENDING",
                            isBusinessAccount,
                        },
                        isRead: false,
                    }).catch(() => {});
                }
            } catch {
                // non-blocking
            }
        }

        if (customerSuccess) dispatchedCount++;
        else failedCount++;

        dispatchDetails.push({
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
            status: customerSuccess ? "SUCCESS" : "FAILED",
        });
    }

    const logRecipients = targetCustomers.map((c) => ({
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        role: c.occupancyRole || "Tenant",
    }));

    const activeChannels = isBusinessAccount
        ? ["WhatsApp (Auto & Manual)", "In-App", "Email"]
        : ["WhatsApp (Manual)", "In-App", "Email"];

    // Auto-populate logs under Invoice Section
    if (messageType === "PAYMENT_CONFIRMED") {
        await PaymentConfirmationLog.create({
            organizationId,
            unitId,
            invoiceId,
            paymentId,
            sentAt: new Date(),
            channels: activeChannels,
            recipients: logRecipients,
            amount,
            paymentMode,
            status: failedCount === 0 ? "SUCCESS" : dispatchedCount > 0 ? "PARTIAL" : "FAILED",
            details: `Dispatched payment confirmation to ${targetCustomers.length} recipient(s).`,
        });
    } else {
        await ReminderLog.create({
            organizationId,
            unitId,
            invoiceId,
            sentAt: new Date(),
            channels: activeChannels,
            recipients: logRecipients,
            dayRule: dayRuleText,
            messageType,
            amount,
            dueDate: typeof dueDate === "string" ? new Date() : dueDate,
            status: failedCount === 0 ? "SUCCESS" : dispatchedCount > 0 ? "PARTIAL" : "FAILED",
            details: `Dispatched multi-channel notice (${dayRuleText}) to ${targetCustomers.length} recipient(s). Channel mode: ${isBusinessAccount ? "Automated & Manual" : "Personal WhatsApp (Manual)"}.`,
        });
    }

    return {
        success: true,
        totalRecipients: targetCustomers.length,
        dispatchedCount,
        failedCount,
        isBusinessAccount,
        requiresManualWhatsApp: !isBusinessAccount,
        details: dispatchDetails,
    };
}
