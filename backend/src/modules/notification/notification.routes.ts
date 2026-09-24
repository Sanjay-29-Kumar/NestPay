import { Router } from "express";
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    sendWhatsAppTestNotification,
    sendRentReminderNotification,
    triggerBatchCronReminders,
    sendInAppMessage,
    getUnitInAppMessages,
} from "./notification.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";
import { sendWhatsAppTestSchema } from "./notification.validation.js";

const router = Router();

router.get("/", authenticate, getUserNotifications);
router.patch("/read-all", authenticate, markAllAsRead);
router.patch("/:id/read", authenticate, markAsRead);

// In-App Messenger routes (Unit-wise chat thread)
router.post("/in-app-message", authenticate, sendInAppMessage);
router.get("/unit-messages", authenticate, getUnitInAppMessages);

// WhatsApp Cloud API Manual Test Endpoint (Protected + Validated + Rate-Limited)
router.post(
    "/whatsapp/test",
    authenticate,
    rateLimiter(10, 60000), // Max 10 requests per minute
    validateRequest(sendWhatsAppTestSchema),
    sendWhatsAppTestNotification
);

// WhatsApp Rent Reminder Dispatcher Endpoint
router.post("/whatsapp/send-rent-reminder", authenticate, sendRentReminderNotification);

// Trigger Automated Daily Batch Cron Job Now (Manual Trigger Endpoint)
router.post("/whatsapp/trigger-cron-now", authenticate, triggerBatchCronReminders);

export default router;




