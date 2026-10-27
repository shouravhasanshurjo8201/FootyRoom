import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI?.trim().replace(/\/+$/, "");
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not configured");
        }

        const connectionInstance = await mongoose.connect(`${mongoUri}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}

export default connectDB;