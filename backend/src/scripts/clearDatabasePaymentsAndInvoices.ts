import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import { Rent } from "../models/Rent.js";
import PaymentConfirmationLog from "../models/PaymentConfirmationLog.js";
import ReminderLog from "../models/ReminderLog.js";
import Notification from "../models/Notification.js";

// Fix Node.js DNS SRV record resolution issue on Windows
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function clearPaymentsAndInvoices() {
    try {
        console.log("Connecting to MongoDB...");
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment.");
        }
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB.");

        console.log("Clearing all payments, invoices, rents, logs, and payment notifications...");

        const paymentRes = await Payment.deleteMany({});
        console.log(`Deleted ${paymentRes.deletedCount} Payment records.`);

        const invoiceRes = await Invoice.deleteMany({});
        console.log(`Deleted ${invoiceRes.deletedCount} Invoice records.`);

        const rentRes = await Rent.deleteMany({});
        console.log(`Deleted ${rentRes.deletedCount} Rent records.`);

        const confirmationLogRes = await PaymentConfirmationLog.deleteMany({});
        console.log(`Deleted ${confirmationLogRes.deletedCount} PaymentConfirmationLog records.`);

        const reminderLogRes = await ReminderLog.deleteMany({});
        console.log(`Deleted ${reminderLogRes.deletedCount} ReminderLog records.`);

        const notificationRes = await Notification.deleteMany({
            $or: [
                { type: { $in: ["PAYMENT", "INVOICE", "PAYMENT_CONFIRMED", "REMINDER", "BILL_ESTABLISHED"] } },
                { title: { $regex: /payment|invoice|bill|rent/i } },
                { message: { $regex: /payment|invoice|bill|rent/i } }
            ]
        });
        console.log(`Deleted ${notificationRes.deletedCount} payment-related Notification records.`);

        console.log("🎉 Successfully cleared all payment & invoice records from database!");
    } catch (error) {
        console.error("❌ Error clearing payments and invoices:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
}

clearPaymentsAndInvoices();
