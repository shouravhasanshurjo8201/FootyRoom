import mongoose, { Schema } from "mongoose";
import type { IBrand } from "../types/index.js";

const brandSchema = new Schema<IBrand>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, lowercase: true }
    },
    { timestamps: true }
);

export const Brand = mongoose.model<IBrand>("Brand", brandSchema);