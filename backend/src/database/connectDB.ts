import mongoose from "mongoose";

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