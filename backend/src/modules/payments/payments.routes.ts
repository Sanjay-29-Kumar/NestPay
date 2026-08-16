import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
    initiatePayment,
    verifyPayment,
    handleWebhook,
    markManualPayment,
    undoManualPayment,
    getPaymentHistory,
    updateRazorpayConfig,
} from "./payments.controller.js";

const router = Router({ mergeParams: true });

// Razorpay In-App Payment Routes
router.post("/initiate", authenticate, initiatePayment);
router.post("/verify", authenticate, verifyPayment);
router.post("/webhook", handleWebhook); // Razorpay webhook (unauthenticated, signature checked)

// Manual Offline Payment Routes (Owner / Admin)
router.post("/manual-mark", authenticate, markManualPayment);
router.post("/manual-undo", authenticate, undoManualPayment);

// Payment History Log
router.get("/history", authenticate, getPaymentHistory);

// Owner Razorpay Credentials Config
router.post("/config", authenticate, updateRazorpayConfig);

export default router;
