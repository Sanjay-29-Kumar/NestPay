import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./database/connectDB.js";
import { initReminderCronJob } from "./services/reminderScheduler.js";


const PORT = process.env.PORT || 5000;

connectDB();

// Initialize background automated WhatsApp rent reminder cron service
initReminderCronJob();

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});