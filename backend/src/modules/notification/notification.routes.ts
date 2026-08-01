import { Router } from "express";
import { getUserNotifications, markAsRead } from "./notification.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", authenticate, getUserNotifications);
router.patch("/:id/read", authenticate, markAsRead);

export default router;
