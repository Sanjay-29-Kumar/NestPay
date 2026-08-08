import cron from "node-cron";
import Customer from "../models/Customer.js";
import Notification from "../models/Notification.js";
import WhatsAppConfig from "../models/WhatsAppConfig.js";
import { sendWhatsAppTextMessage } from "./whatsapp.provider.js";

export interface BatchReminderResult {
    success: boolean;
    dayOfMonth: number;
    reminderEvent: string;
    totalProcessed: number;
    totalDispatched: number;
    totalFailed: number;
    details: Array<{
        tenantName: string;
        phone: string;
        status: "DISPATCHED" | "FAILED" | "SKIPPED";
        reason?: string;
        messageId?: string;
    }>;
}

/**
 * Executes the daily automated rent reminder batch job.
 * Can be called automatically by cron schedule or manually triggered by Organization Owners.
 */
export async function runDailyRentReminders(): Promise<BatchReminderResult> {
    const today = new Date();
    const dayOfMonth = today.getDate();

    let reminderEvent = "";
    if (dayOfMonth === 1) reminderEvent = "1ST (Advance Notice)";
    else if (dayOfMonth === 7) reminderEvent = "7TH (Upcoming Reminder)";
    else if (dayOfMonth === 10) reminderEvent = "10TH (Due Date Today)";
    else if (dayOfMonth >= 11 && dayOfMonth <= 15) reminderEvent = `${dayOfMonth}TH (Overdue Notice)`;
    else {
        // Development fallback: if run outside 1st/7th/10th/11-15th, default to standard reminder event
        reminderEvent = `DAY_${dayOfMonth} (Scheduled Check)`;
    }

    const results: BatchReminderResult["details"] = [];
    let totalDispatched = 0;
    let totalFailed = 0;

    // Fetch all active customers assigned to a unit
    const activeCustomers = await Customer.find({ status: "ACTIVE", unitId: { $ne: null } })
        .populate("organizationId", "name")
        .populate("unitId", "unitNumber rentAmount");

    for (const customer of activeCustomers) {
        if (!customer.phone) {
            results.push({
                tenantName: customer.name,
                phone: customer.phone || "N/A",
                status: "SKIPPED",
                reason: "No phone number registered.",
            });
            continue;
        }

        const orgName = (customer.organizationId as any)?.name || "NestPay Workspace";
        const unitNumber = (customer.unitId as any)?.unitNumber || "N/A";
        const rentAmount = (customer.unitId as any)?.rentAmount || "1,200";
        const dueDate = `${today.toLocaleString("default", { month: "long" })} 10th`;

        // Check if organization has custom WhatsApp config
        const orgConfig = await WhatsAppConfig.findOne({
            organizationId: customer.organizationId,
            status: "ACTIVE",
        });

        const reminderMessage = `[${reminderEvent}] Hi ${customer.name}, your rent of $${rentAmount} for ${orgName} (Unit ${unitNumber}) is due on ${dueDate}. Please complete your payment at your earliest convenience. Thank you!`;

        const dispatchRes = await sendWhatsAppTextMessage({
            to: customer.phone,
            message: reminderMessage,
            phoneNumberId: orgConfig?.phoneNumberId,
        });

        if (dispatchRes.success) {
            totalDispatched++;
            results.push({
                tenantName: customer.name,
                phone: customer.phone,
                status: "DISPATCHED",
                messageId: dispatchRes.messageId,
            });

            // Log in-app notification for record keeping
            if (customer.userId) {
                await Notification.create({
                    userId: customer.userId,
                    type: "PAYMENT_REMINDER",
                    title: `Automated WhatsApp Rent Reminder (${reminderEvent})`,
                    message: reminderMessage,
                    isRead: false,
                }).catch(() => {});
            }
        } else {
            totalFailed++;
            results.push({
                tenantName: customer.name,
                phone: customer.phone,
                status: "FAILED",
                reason: dispatchRes.error || "Failed to deliver WhatsApp message.",
            });
        }
    }

    return {
        success: true,
        dayOfMonth,
        reminderEvent,
        totalProcessed: activeCustomers.length,
        totalDispatched,
        totalFailed,
        details: results,
    };
}

/**
 * Initializes the background node-cron scheduler running daily at 08:00 AM
 */
export function initReminderCronJob() {
    console.log("⏰ WhatsApp Automated Rent Reminder Cron Service initialized (Running daily at 08:00 AM).");

    cron.schedule("0 8 * * *", async () => {
        console.log("🤖 Running scheduled daily WhatsApp rent reminders batch...");
        try {
            const summary = await runDailyRentReminders();
            console.log(`✅ Automated Rent Reminders Completed: ${summary.totalDispatched} dispatched, ${summary.totalFailed} failed.`);
        } catch (err: any) {
            console.error("❌ Error running scheduled rent reminders:", err.message);
        }
    });
}
