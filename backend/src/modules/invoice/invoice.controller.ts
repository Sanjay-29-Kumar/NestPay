import { Request, Response } from "express";
import invoiceService from "./invoice.service.js";
import Membership from "../../models/Membership.js";
import Customer from "../../models/Customer.js";
import User from "../../models/User.js";

async function isOwnerOrAdmin(userId: string, orgId: string): Promise<boolean> {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });
    return Boolean(membership);
}

async function canAccessUnit(userId: string, orgId: string, unitId: string): Promise<boolean> {
    const isOwner = await isOwnerOrAdmin(userId, orgId);
    if (isOwner) return true;

    // Check if user is an active occupant of this unit
    const userObj = await User.findById(userId);
    const userEmail = userObj?.email?.toLowerCase();
    const userPhone = userObj?.phone;

    const isOccupant = await Customer.exists({
        organizationId: orgId,
        unitId,
        $or: [
            { userId },
            ...(userEmail ? [{ email: userEmail }] : []),
            ...(userPhone ? [{ phone: userPhone }] : []),
        ],
        status: "ACTIVE",
    });

    return Boolean(isOccupant);
}

export class InvoiceController {
    /**
     * GET /api/v1/organizations/:orgId/units/:unitId/invoice/settings
     */
    async getSettings(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can view schedule settings." });
            }

            const settings = await invoiceService.getReminderSchedule(orgId, unitId);
            res.json({ success: true, data: settings });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to get invoice settings." });
        }
    }

    /**
     * PUT /api/v1/organizations/:orgId/units/:unitId/invoice/settings
     */
    async updateSettings(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can update reminder settings." });
            }

            const { primaryTenantDays, allTenantsDays } = req.body;
            const settings = await invoiceService.updateReminderSchedule(orgId, unitId, {
                primaryTenantDays,
                allTenantsDays,
            });
            res.json({ success: true, message: "Reminder schedule updated successfully.", data: settings });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to update invoice settings." });
        }
    }

    /**
     * GET /api/v1/organizations/:orgId/units/:unitId/invoice/current
     */
    async getCurrentInvoice(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await canAccessUnit(userId, orgId, unitId)) {
                return res.status(403).json({ success: false, message: "Unauthorized. You only have access to your own unit." });
            }

            const invoice = await invoiceService.getCurrentInvoice(orgId, unitId);
            const schedule = await invoiceService.getReminderSchedule(orgId, unitId);
            res.json({ success: true, data: { invoice, schedule } });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to get current invoice." });
        }
    }

    /**
     * PUT /api/v1/organizations/:orgId/units/:unitId/invoice/amount
     */
    async updateAmount(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can update invoice amount." });
            }

            const { overrideAmount, notes } = req.body;
            const invoice = await invoiceService.updateInvoiceAmount(orgId, unitId, {
                overrideAmount: overrideAmount !== undefined ? Number(overrideAmount) : undefined,
                notes,
            });
            res.json({
                success: true,
                message: "Invoice amount updated and tenant(s) notified successfully.",
                data: invoice,
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to update invoice amount." });
        }
    }

    /**
     * POST /api/v1/organizations/:orgId/units/:unitId/invoice/establish-bill
     */
    async establishBill(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can establish bills." });
            }

            const { utilitiesAmount, totalAmount, notes, dueDate, billingPeriod } = req.body;
            const result = await invoiceService.establishBill(orgId, unitId, {
                utilitiesAmount: utilitiesAmount !== undefined ? Number(utilitiesAmount) : undefined,
                totalAmount: totalAmount !== undefined ? Number(totalAmount) : undefined,
                notes,
                dueDate,
                billingPeriod,
            });
            res.json({
                success: true,
                message: "Bill established and payment demand issued across WhatsApp, In-App, and Email.",
                data: result,
            });
        } catch (err: any) {
            console.error("❌ Error in establishBill:", err);
            res.status(500).json({ success: false, message: err.message || "Failed to establish bill and issue demand." });
        }
    }

    /**
     * POST /api/v1/organizations/:orgId/units/:unitId/invoice/issue-payment
     */
    async issuePayment(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can issue payment demands." });
            }

            const result = await invoiceService.issuePaymentDemand(orgId, unitId);
            res.json({
                success: true,
                message: "Payment demand issued immediately across WhatsApp, In-App, and Email.",
                data: result,
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to issue payment demand." });
        }
    }

    /**
     * POST /api/v1/organizations/:orgId/units/:unitId/invoice/mark-paid
     */
    async markPaid(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can mark invoices as paid." });
            }

            const { amount, paymentMode, notes } = req.body;

            const result = await invoiceService.markManualPayment(orgId, unitId, {
                amount: amount ? Number(amount) : undefined,
                paymentMode: paymentMode || "CASH",
                notes,
                markedById: userId ? String(userId) : undefined,
            });

            res.json({
                success: true,
                message: `Invoice marked Paid via ${paymentMode || "Cash"}. Confirmation notification sent & logged.`,
                data: result,
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to mark invoice as paid." });
        }
    }

    /**
     * GET /api/v1/organizations/:orgId/units/:unitId/invoice/reminder-logs
     */
    async getReminderLogs(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await canAccessUnit(userId, orgId, unitId)) {
                return res.status(403).json({ success: false, message: "Unauthorized. You only have access to your own unit." });
            }

            const logs = await invoiceService.getReminderLogs(orgId, unitId);
            res.json({ success: true, data: logs });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to get reminder logs." });
        }
    }

    /**
     * GET /api/v1/organizations/:orgId/units/:unitId/invoice/confirmation-logs
     */
    async getConfirmationLogs(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);

            if (!await canAccessUnit(userId, orgId, unitId)) {
                return res.status(403).json({ success: false, message: "Unauthorized. You only have access to your own unit." });
            }

            const logs = await invoiceService.getConfirmationLogs(orgId, unitId);
            res.json({ success: true, data: logs });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to get confirmation logs." });
        }
    }

    /**
     * POST /api/v1/organizations/:orgId/units/:unitId/invoice/run-cron-check
     */
    async runCronCheck(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can trigger cron checks." });
            }

            const result = await invoiceService.runMonthlyAutoCycleAndReminders();
            res.json({ success: true, message: "Monthly auto-cycle & reminder check completed.", data: result });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to run cron check." });
        }
    }

    /**
     * DELETE /api/v1/organizations/:orgId/units/:unitId/invoice/clear-all-records
     */
    async clearAllRecords(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id || (req as any).user?.userId;
            const orgId = String(req.params.orgId);

            if (!await isOwnerOrAdmin(userId, orgId)) {
                return res.status(403).json({ success: false, message: "Only Owners and Admins can clear records." });
            }

            const result = await invoiceService.clearAllPaymentsAndInvoices();
            res.json({ success: true, message: "All payment and invoice records cleared successfully.", data: result });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to clear payment records." });
        }
    }
}

export const invoiceController = new InvoiceController();
export default invoiceController;
