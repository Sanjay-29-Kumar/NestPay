import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../../middleware/authenticate.js";
import { getMessages, sendMessage, markRead, uploadPhoto } from "./chat.controller.js";

// Ensure uploads/chat folder exists
const uploadDir = path.join(process.cwd(), "uploads", "chat");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `chat-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed in chat."));
        }
    },
});

const router = Router({ mergeParams: true });

router.get("/messages", authenticate, getMessages);
router.post("/messages", authenticate, sendMessage);
router.patch("/read", authenticate, markRead);
router.post("/upload", authenticate, upload.single("photo"), uploadPhoto);

export default router;
