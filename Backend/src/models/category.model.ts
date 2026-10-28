import mongoose, { Schema } from "mongoose";
import type { ICategory } from "../types/index.js";

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, lowercase: true }
    },
    { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);