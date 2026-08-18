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

        // 1. WhatsApp Dispatch
        if (customer.phone) {
            await sendWhatsAppTextMessage({
                to: customer.phone,
                message: bodyMessage,
                phoneNumberId: orgWhatsAppConfig?.phoneNumberId,
            }).catch(() => {});
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
            }).catch(() => {});
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

    // Auto-populate logs under Invoice Section
    if (messageType === "PAYMENT_CONFIRMED") {
        await PaymentConfirmationLog.create({
            organizationId,
            unitId,
            invoiceId,
            paymentId,
            sentAt: new Date(),
            channels: ["WhatsApp", "In-App", "Email"],
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
            channels: ["WhatsApp", "In-App", "Email"],
            recipients: logRecipients,
            dayRule: dayRuleText,
            messageType,
            amount,
            dueDate: typeof dueDate === "string" ? new Date() : dueDate,
            status: failedCount === 0 ? "SUCCESS" : dispatchedCount > 0 ? "PARTIAL" : "FAILED",
            details: `Dispatched multi-channel notice (${dayRuleText}) to ${targetCustomers.length} recipient(s).`,
        });
    }

    return {
        success: true,
        totalRecipients: targetCustomers.length,
        dispatchedCount,
        failedCount,
        details: dispatchDetails,
    };
}
