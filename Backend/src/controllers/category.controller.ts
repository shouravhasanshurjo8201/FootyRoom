import type { Request, Response } from "express";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
        throw new ApiError(400, "Category name is required");
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/\s+/g, '-');

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
        throw new ApiError(409, "Category already exists");
    }

    const category = await Category.create({
        name: trimmedName,
        slug,
    });

    return res.status(201).json(
        new ApiResponse(201, category, "Category created successfully")
    );
});

export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await Category.find({}).sort({ name: 1 }).lean();

    return res.status(200).json(
        new ApiResponse(200, categories, "Categories fetched successfully")
    );
});