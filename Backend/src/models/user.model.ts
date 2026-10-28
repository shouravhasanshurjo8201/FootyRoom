import mongoose, { Schema } from "mongoose";
import type { IUser } from "../types/index.js";

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        avatar: { type: String },
        googleId: { type: String, required: true, unique: true },
        refreshToken: { type: String }
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);