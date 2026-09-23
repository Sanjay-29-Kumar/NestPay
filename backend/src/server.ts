import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./database/connectDB.js";
import { initReminderCronJob } from "./services/reminderScheduler.js";
import { initSocketServer } from "./services/socket.js";

const PORT = process.env.PORT || 5000;

connectDB();

// Initialize background automated WhatsApp rent reminder cron service
initReminderCronJob();

const server = http.createServer(app);
initSocketServer(server);

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});