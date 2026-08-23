import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import invoiceController from "./invoice.controller.js";

const router = Router({ mergeParams: true });

// Reminder schedule settings (default vs custom days per unit)
router.get("/settings", authenticate, invoiceController.getSettings);
router.put("/settings", authenticate, invoiceController.updateSettings);

// Current invoice & amount override management
router.get("/current", authenticate, invoiceController.getCurrentInvoice);
router.put("/amount", authenticate, invoiceController.updateAmount);
router.post("/establish-bill", authenticate, invoiceController.establishBill);

// Manual issue payment trigger by Owner
router.post("/issue-payment", authenticate, invoiceController.issuePayment);

// Manual payment recording (Mark as Paid with Payment Mode selector)
router.post("/mark-paid", authenticate, invoiceController.markPaid);

// Invoice section read-only logs per unit
router.get("/reminder-logs", authenticate, invoiceController.getReminderLogs);
router.get("/confirmation-logs", authenticate, invoiceController.getConfirmationLogs);

// Manual trigger for monthly auto-cycle & reminder check (testing/admin)
router.post("/run-cron-check", authenticate, invoiceController.runCronCheck);

// Admin / Owner cleanup endpoint to reset all payments & invoices
router.delete("/clear-all-records", authenticate, invoiceController.clearAllRecords);

export default router;
