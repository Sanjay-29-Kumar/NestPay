import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";
import paymentsService from "./payments.service.js";

/**
 * Tenant initiates Razorpay Order
 */
export async function initiatePayment(req: Request, res: Response) {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { orgId, unitId, amount, billingMonth } = req.body;
        if (!orgId || !unitId || !amount) {
            return res.status(400).json({ success: false, message: "orgId, unitId, and amount are required." });
        }

        const result = await paymentsService.initiatePayment({
            orgId,
            unitId,
            tenantId: user.userId,
            amount: Number(amount),
            billingMonth,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Tenant verifies payment signature after Razorpay Checkout completion
 */
export async function verifyPayment(req: Request, res: Response) {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { orgId, orderId, paymentId, signature } = req.body;
        if (!orgId || !orderId || !paymentId || !signature) {
            return res.status(400).json({ success: false, message: "orgId, orderId, paymentId, and signature are required." });
        }

        const result = await paymentsService.verifyPayment({
            orgId,
            orderId,
            paymentId,
            signature,
            tenantId: user.userId,
        });

        return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Razorpay Webhook Handler (payment.captured)
 */
export async function handleWebhook(req: Request, res: Response) {
    try {
        const signature = req.headers["x-razorpay-signature"] as string || "";
        const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

        const result = await paymentsService.handleWebhook(req.body, rawBody, signature);
        return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Owner / Admin Marks Payment Manually
 */
export async function markManualPayment(req: Request, res: Response) {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { orgId, unitId, tenantId, amount, billingMonth, manualPaymentType, manualNote, paidDate } = req.body;

        if (!orgId || !unitId || !amount || !manualPaymentType) {
            return res.status(400).json({ success: false, message: "orgId, unitId, amount, and manualPaymentType are required." });
        }

        const payment = await paymentsService.markManualPayment({
            orgId,
            unitId,
            tenantId,
            amount: Number(amount),
            billingMonth,
            manualPaymentType,
            manualNote,
            paidDate,
            markedById: user.userId,
        });

        return res.status(201).json({ success: true, payment });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Owner Undoes Manual Payment
 */
export async function undoManualPayment(req: Request, res: Response) {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { paymentId, orgId } = req.body;
        if (!paymentId || !orgId) {
            return res.status(400).json({ success: false, message: "paymentId and orgId are required." });
        }

        const payment = await paymentsService.undoManualPayment(paymentId, orgId);
        return res.status(200).json({ success: true, payment });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Get Payment History
 */
export async function getPaymentHistory(req: Request, res: Response) {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId || (req.query.orgId as string);
        const unitId = req.query.unitId as string | undefined;
        const tenantId = req.query.tenantId as string | undefined;

        if (!orgId) return res.status(400).json({ success: false, message: "orgId is required." });

        const history = await paymentsService.getPaymentHistory(orgId, unitId, tenantId);
        return res.status(200).json({ success: true, history });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Owner updates Razorpay credentials
 */
export async function updateRazorpayConfig(req: Request, res: Response) {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
        const { keyId, keySecret } = req.body;

        const org = await paymentsService.updateOwnerRazorpayConfig(orgId, keyId || "", keySecret || "");
        return res.status(200).json({ success: true, razorpayConfig: org.razorpayConfig });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
