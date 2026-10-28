import type { Request, Response } from "express";
import { Brand } from "../models/brand.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
        throw new ApiError(400, "Brand name is required");
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/\s+/g, '-');
    const existingBrand = await Brand.findOne({ slug });
    if (existingBrand) {
        throw new ApiError(409, "Brand already exists");
    }

    const brand = await Brand.create({
        name: trimmedName,
        slug,
    });

    return res.status(201).json(
        new ApiResponse(201, brand, "Brand created successfully")
    );
});

export const getAllBrands = asyncHandler(async (req: Request, res: Response) => {
    const brands = await Brand.find({}).sort({ name: 1 }).lean();

    return res.status(200).json(
        new ApiResponse(200, brands, "Brands fetched successfully")
    );
});