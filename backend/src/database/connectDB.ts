import mongoose from "mongoose";
import dns from "dns";

// Fix Node.js DNS SRV record resolution issue (ECONNREFUSED) on local ISP/Windows DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);

        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed");
        console.error(error);

        // Don't stop the server during development.
        // We'll handle this properly later.
    }
}

export default connectDB;