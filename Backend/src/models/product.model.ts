import mongoose, { Schema } from "mongoose";
import type { IProduct } from "../types/index.js";

const productSchema = new Schema<IProduct>(
    {
        productName: { type: String, required: true, trim: true, index: true },
        avatar: { type: String, required: true },
        brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
        category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        price: { type: Number, required: true, index: true },
        date: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);