import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();

const connectDB = async () => {
    try {
        // Hardcoded string ki jagah process.env.MONGODB_URL ka use karein
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;