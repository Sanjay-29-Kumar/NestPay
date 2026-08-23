import ReminderSchedule, { IReminderSchedule } from "../../models/ReminderSchedule.js";
import Invoice, { InvoiceStatus, IInvoice } from "../../models/Invoice.js";
import ReminderLog from "../../models/ReminderLog.js";
import PaymentConfirmationLog from "../../models/PaymentConfirmationLog.js";
import Unit from "../../models/Unit.js";
import { Rent, RentStatus } from "../../models/Rent.js";
import Payment, { PaymentStatus } from "../../models/Payment.js";
import { dispatchMultiChannelNotification } from "../../services/multiChannelDispatch.js";

export interface UpdateScheduleDTO {
    primaryTenantDays: number[];
    allTenantsDays: number[];
}

export interface UpdateAmountDTO {
    overrideAmount?: number;
    notes?: string;
}

export interface EstablishBillDTO {
    utilitiesAmount?: number;
    totalAmount?: number;
    notes?: string;
    dueDate?: string | Date;
    billingPeriod?: string;
}

export interface MarkPaidDTO {
    amount?: number;
    paymentMode: "CASH" | "UPI" | "GPay" | "Bank Transfer" | "OTHER" | "APP";
    notes?: string;
    markedById?: string;
}

class InvoiceService {
    /**
     * Format current month as billing period string e.g. "August 2026" or "2026-08"
     */
    private getBillingPeriod(date: Date = new Date()): string {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    /**
     * Get or initialize per-unit Reminder Schedule Config
     */
    async getReminderSchedule(orgId: string, unitId: string): Promise<IReminderSchedule> {
        let schedule = await ReminderSchedule.findOne({ unitId });
        if (!schedule) {
            schedule = await ReminderSchedule.create({
                organizationId: orgId,
                unitId,
                primaryTenantDays: [1, 10, 15],
                allTenantsDays: [10, 15],
                isCustom: false,
            });
        }
        return schedule;
    }

    /**
     * Update custom per-unit Reminder Schedule Config
     */
    async updateReminderSchedule(
        orgId: string,
        unitId: string,
        dto: UpdateScheduleDTO
    ): Promise<IReminderSchedule> {
        const { primaryTenantDays, allTenantsDays } = dto;

        let schedule = await ReminderSchedule.findOne({ unitId });
        if (!schedule) {
            schedule = new ReminderSchedule({
                organizationId: orgId,
                unitId,
            });
        }

        schedule.primaryTenantDays = primaryTenantDays || [1, 10, 15];
        schedule.allTenantsDays = allTenantsDays || [10, 15];
        schedule.isCustom = true;
        await schedule.save();

        return schedule;
    }

    /**
     * Get or auto-generate current cycle Invoice for unit
     */
    async getCurrentInvoice(orgId: string, unitId: string): Promise<IInvoice> {
        const unit = await Unit.findById(unitId);
        if (!unit) {
            throw new Error("Unit not found.");
        }

        const billingPeriod = this.getBillingPeriod();
        let invoice = await Invoice.findOne({ unitId, billingPeriod });

        if (!invoice) {
            const today = new Date();
            const dueDate = new Date(today.getFullYear(), today.getMonth(), 10);

            const defaultRentAmount = unit.rentAmount || 0;

            invoice = await Invoice.create({
                organizationId: orgId,
                propertyId: unit.propertyId,
                unitId,
                billingPeriod,
                dueDate,
                defaultRentAmount,
                totalAmount: defaultRentAmount,
                status: InvoiceStatus.UNPAID,
            });
        }

        return invoice;
    }

    /**
     * Owner sets/overrides amount due for current billing cycle
     * Immediately triggers notification to tenant(s)
     */
    async updateInvoiceAmount(
        orgId: string,
        unitId: string,
        dto: UpdateAmountDTO
    ): Promise<IInvoice> {
        const result = await this.establishBill(orgId, unitId, {
            totalAmount: dto.overrideAmount,
            notes: dto.notes,
        });
        return result.invoice;
    }

    /**
     * Owner establishes monthly bill (Rent + Utilities & Maintenance) in Payment section
     * Triggers multi-channel dispatch engine to Primary Tenant or All Tenants based on Reminder Schedule Settings
     * Logs dispatch in Payment Reminder Log as "Bill Established"
     */
    async establishBill(orgId: string, unitId: string, dto: EstablishBillDTO) {
        const invoice = await this.getCurrentInvoice(orgId, unitId);
        const { utilitiesAmount, totalAmount, notes, dueDate, billingPeriod } = dto;

        const defaultRent = invoice.defaultRentAmount || 0;
        const calculatedTotal =
            totalAmount !== undefined
                ? totalAmount
                : defaultRent + (utilitiesAmount || 0);

        invoice.totalAmount = calculatedTotal;
        invoice.isEstablished = true;
        if (utilitiesAmount !== undefined) {
            invoice.overrideAmount = utilitiesAmount;
        }
        if (notes !== undefined) invoice.notes = notes;
        if (dueDate) invoice.dueDate = new Date(dueDate);
        if (billingPeriod) invoice.billingPeriod = billingPeriod;
        await invoice.save();

        // Sync Rent model if exists
        await Rent.findOneAndUpdate(
            { unitId, billingPeriod: invoice.billingPeriod },
            {
                amount: invoice.totalAmount,
                dueAmount: invoice.totalAmount,
            }
        ).catch(() => {});

        // Fetch per-unit Reminder Schedule to determine recipient scope (PRIMARY vs ALL)
        const schedule = await this.getReminderSchedule(orgId, unitId);
        const recipientTarget: "PRIMARY" | "ALL" =
            schedule && schedule.allTenantsDays && schedule.allTenantsDays.length > 0
                ? "ALL"
                : "PRIMARY";

        const dispatchRes = await dispatchMultiChannelNotification({
            organizationId: orgId,
            unitId,
            invoiceId: String(invoice._id),
            recipients: recipientTarget,
            messageType: "AMOUNT_SET",
            amount: invoice.totalAmount,
            dueDate: invoice.dueDate,
            billingPeriod: invoice.billingPeriod,
            dayRuleLabel: "Bill Established",
        }).catch((err) => {
            console.error("Error dispatching bill establishment notification:", err);
            return null;
        });

        // Post bill update as a system message in the unit's Chat thread
        const { postSystemChatMessage } = await import("../chat/chat.service.js");
        const formattedDueDate = invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
              })
            : "N/A";

        await postSystemChatMessage(
            orgId,
            unitId,
            `📌 Rent demand updated to ₹${invoice.totalAmount.toLocaleString()} for ${invoice.billingPeriod}. Payment Due Date: ${formattedDueDate}.`
        ).catch((err) => console.error("Error posting system chat message:", err));

        return {
            invoice,
            dispatchRes,
        };
    }

    /**
     * Manual Trigger: "Issue Payment" action by Owner
     */
    async issuePaymentDemand(orgId: string, unitId: string) {
        const invoice = await this.getCurrentInvoice(orgId, unitId);

        const dispatchRes = await dispatchMultiChannelNotification({
            organizationId: orgId,
            unitId,
            invoiceId: String(invoice._id),
            recipients: "ALL",
            messageType: "MANUAL_ISSUE",
            amount: invoice.totalAmount,
            dueDate: invoice.dueDate,
            billingPeriod: invoice.billingPeriod,
            dayRuleLabel: "Manual Issue Payment",
        });

        return {
            invoice,
            dispatchRes,
        };
    }

    /**
     * Unified payment completion handler (called by manual mark paid or Razorpay webhook/verify)
     */
    async processPaymentCompletion(
        orgId: string,
        unitId: string,
        paymentMode: string,
        amount?: number,
        notes?: string,
        paymentId?: string
    ) {
        const invoice = await this.getCurrentInvoice(orgId, unitId);

        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = new Date();
        invoice.paymentMode = paymentMode;
        if (notes) invoice.notes = notes;
        if (amount) invoice.totalAmount = amount;
        await invoice.save();

        // Sync Rent model if exists
        await Rent.findOneAndUpdate(
            { unitId, billingPeriod: invoice.billingPeriod },
            {
                status: RentStatus.PAID,
                paidAmount: invoice.totalAmount,
                outstandingAmount: 0,
            }
        ).catch(() => {});

        // Trigger Payment Confirmation Dispatch to tenants (WhatsApp + In-App + Email)
        const dispatchRes = await dispatchMultiChannelNotification({
            organizationId: orgId,
            unitId,
            invoiceId: String(invoice._id),
            paymentId,
            recipients: "ALL",
            messageType: "PAYMENT_CONFIRMED",
            amount: invoice.totalAmount,
            dueDate: invoice.dueDate,
            billingPeriod: invoice.billingPeriod,
            paymentMode,
        }).catch((err) => {
            console.error("Error dispatching payment confirmation:", err);
            return null;
        });

        return {
            invoice,
            dispatchRes,
        };
    }

    /**
     * Manual Payment Recording by Owner
     */
    async markManualPayment(orgId: string, unitId: string, dto: MarkPaidDTO) {
        const { amount, paymentMode, notes, markedById } = dto;
        const invoice = await this.getCurrentInvoice(orgId, unitId);
        const finalAmount = amount || invoice.totalAmount;

        const receiptNo = `REC-MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create Payment record for tracking
        const payment = await Payment.create({
            organizationId: orgId,
            unitId,
            tenantId: markedById || orgId,
            invoiceId: invoice._id,
            amount: finalAmount,
            currency: "INR",
            paymentMode: "MANUAL",
            paymentStatus: PaymentStatus.PAID_MANUAL,
            manualPaymentType: paymentMode as any,
            manualNote: notes || `Marked paid via ${paymentMode}`,
            markedBy: markedById,
            markedAt: new Date(),
            paidDate: new Date(),
            receiptNo,
            invoiceMonth: invoice.billingPeriod,
        });

        return this.processPaymentCompletion(
            orgId,
            unitId,
            paymentMode,
            finalAmount,
            notes,
            String(payment._id)
        );
    }

    /**
     * Get Payment Reminder Logs for unit
     */
    async getReminderLogs(orgId: string, unitId: string) {
        return ReminderLog.find({ organizationId: orgId, unitId }).sort({ sentAt: -1 });
    }

    /**
     * Get Payment Confirmation Logs for unit
     */
    async getConfirmationLogs(orgId: string, unitId: string) {
        return PaymentConfirmationLog.find({ organizationId: orgId, unitId }).sort({ sentAt: -1 });
    }

    /**
     * Scheduled Job: Monthly Auto-Cycle & Daily Automated Reminder Evaluator
     */
    async runMonthlyAutoCycleAndReminders() {
        const today = new Date();
        const dayOfMonth = today.getDate();
        const billingPeriod = this.getBillingPeriod(today);

        // Fetch all occupied units
        const occupiedUnits = await Unit.find({ status: "OCCUPIED" });
        let processedCount = 0;
        let dispatchedRemindersCount = 0;

        for (const unit of occupiedUnits) {
            processedCount++;
            const orgId = unit.organizationId.toString();
            const unitId = unit._id.toString();

            // 1. Auto-generate/ensure invoice for current billing period
            let invoice = await Invoice.findOne({ unitId, billingPeriod });
            if (!invoice) {
                const dueDate = new Date(today.getFullYear(), today.getMonth(), 10);
                invoice = await Invoice.create({
                    organizationId: orgId,
                    propertyId: unit.propertyId,
                    unitId,
                    billingPeriod,
                    dueDate,
                    defaultRentAmount: unit.rentAmount || 0,
                    totalAmount: unit.rentAmount || 0,
                    status: InvoiceStatus.UNPAID,
                });
            }

            // If invoice is already PAID, skip reminders for this cycle
            if (invoice.status === InvoiceStatus.PAID) {
                continue;
            }

            // 2. Fetch or initialize schedule for unit
            const schedule = await this.getReminderSchedule(orgId, unitId);
            const primaryDays = schedule.primaryTenantDays || [1, 10, 15];
            const allDays = schedule.allTenantsDays || [10, 15];

            // 3. Check if today triggers Primary Tenant reminder
            if (primaryDays.includes(dayOfMonth)) {
                await dispatchMultiChannelNotification({
                    organizationId: orgId,
                    unitId,
                    invoiceId: String(invoice._id),
                    recipients: "PRIMARY",
                    messageType: "REMINDER",
                    amount: invoice.totalAmount,
                    dueDate: invoice.dueDate,
                    billingPeriod,
                    dayRuleLabel: `Day ${dayOfMonth} — Primary Tenant`,
                }).catch(() => {});
                dispatchedRemindersCount++;
            }

            // 4. Check if today triggers All Tenants reminder
            if (allDays.includes(dayOfMonth)) {
                await dispatchMultiChannelNotification({
                    organizationId: orgId,
                    unitId,
                    invoiceId: String(invoice._id),
                    recipients: "ALL",
                    messageType: "REMINDER",
                    amount: invoice.totalAmount,
                    dueDate: invoice.dueDate,
                    billingPeriod,
                    dayRuleLabel: `Day ${dayOfMonth} — All Tenants`,
                }).catch(() => {});
                dispatchedRemindersCount++;
            }
        }

        return {
            success: true,
            dayOfMonth,
            billingPeriod,
            processedUnits: processedCount,
            dispatchedRemindersCount,
        };
    }

    /**
     * Clear all payments, invoices, rents, logs, and payment notifications across database
     */
    async clearAllPaymentsAndInvoices() {
        const paymentRes = await Payment.deleteMany({});
        const invoiceRes = await Invoice.deleteMany({});
        const rentRes = await Rent.deleteMany({});
        const confirmationLogRes = await PaymentConfirmationLog.deleteMany({});
        const reminderLogRes = await ReminderLog.deleteMany({});
        
        return {
            paymentsDeleted: paymentRes.deletedCount,
            invoicesDeleted: invoiceRes.deletedCount,
            rentsDeleted: rentRes.deletedCount,
            confirmationLogsDeleted: confirmationLogRes.deletedCount,
            reminderLogsDeleted: reminderLogRes.deletedCount,
        };
    }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
