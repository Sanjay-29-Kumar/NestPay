import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// Fix Node.js DNS SRV record resolution issue on Windows
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function clearAllNotifications() {
    try {
        console.log("Connecting to MongoDB...");
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment.");
        }
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB.");

        console.log("Clearing all existing notification records...");

        const notificationRes = await Notification.deleteMany({});
        console.log(`Deleted ${notificationRes.deletedCount} Notification records.`);

        console.log("🎉 Successfully cleared all notifications! Starting fresh.");
    } catch (error) {
        console.error("❌ Error clearing notifications:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
}

clearAllNotifications();
