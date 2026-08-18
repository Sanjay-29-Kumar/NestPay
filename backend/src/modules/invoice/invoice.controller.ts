import { Request, Response } from "express";
import invoiceService from "./invoice.service.js";

export class InvoiceController {
    /**
     * GET /api/v1/organizations/:orgId/units/:unitId/invoice/settings
     */
    async getSettings(req: Request, res: Response) {
        try {
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            res.status(500).json({ success: false, message: err.message || "Failed to establish bill and issue demand." });
        }
    }

    /**
     * POST /api/v1/organizations/:orgId/units/:unitId/invoice/issue-payment
     */
    async issuePayment(req: Request, res: Response) {
        try {
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
            const { amount, paymentMode, notes } = req.body;
            const userId = (req as any).user?._id || (req as any).user?.id;

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
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            const orgId = String(req.params.orgId);
            const unitId = String(req.params.unitId);
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
            const result = await invoiceService.runMonthlyAutoCycleAndReminders();
            res.json({ success: true, message: "Monthly auto-cycle & reminder check completed.", data: result });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message || "Failed to run cron check." });
        }
    }
}

export const invoiceController = new InvoiceController();
export default invoiceController;
