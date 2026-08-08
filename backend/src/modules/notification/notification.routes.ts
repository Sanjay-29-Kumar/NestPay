import { Router } from "express";
import { getUserNotifications, markAsRead, markAllAsRead } from "./notification.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, getUserNotifications);
router.patch("/read-all", authenticate, markAllAsRead);
router.patch("/:id/read", authenticate, markAsRead);

export default router;

