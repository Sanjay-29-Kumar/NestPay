import { Router } from "express";
import { getUserNotifications, markAsRead, markAllAsRead, sendWhatsAppTestNotification, sendRentReminderNotification, triggerBatchCronReminders } from "./notification.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, getUserNotifications);
router.patch("/read-all", authenticate, markAllAsRead);
router.patch("/:id/read", authenticate, markAsRead);

// WhatsApp Cloud API Test Endpoint (Phase 5)
router.post("/whatsapp/test", authenticate, sendWhatsAppTestNotification);

// WhatsApp Rent Reminder Dispatcher Endpoint (Phase 8)
router.post("/whatsapp/send-rent-reminder", authenticate, sendRentReminderNotification);

// Trigger Automated Daily Batch Cron Job Now (Manual Trigger Endpoint)
router.post("/whatsapp/trigger-cron-now", authenticate, triggerBatchCronReminders);

export default router;




