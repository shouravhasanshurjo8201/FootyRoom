import type { Response } from "express";
import { Product } from "../models/product.model.js";
import { Brand } from "../models/brand.model.js";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import type { AuthenticatedRequest } from "../types/index.js";

const resolveBrandId = async (brandInput: string) => {
    if (!brandInput) return null;

    if (/^[0-9a-fA-F]{24}$/.test(brandInput)) {
        const found = await Brand.findById(brandInput);
        if (found) return found._id;
    }

    const trimmed = brandInput.trim();
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-');

    let brandDoc = await Brand.findOne({ slug });
    if (!brandDoc) {
        brandDoc = await Brand.create({ name: trimmed, slug });
    }
    return brandDoc._id;
};

const resolveCategoryId = async (categoryInput: string) => {
    if (!categoryInput) return null;

    if (/^[0-9a-fA-F]{24}$/.test(categoryInput)) {
        const found = await Category.findById(categoryInput);
        if (found) return found._id;
    }

    const trimmed = categoryInput.trim();
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-');

    let categoryDoc = await Category.findOne({ slug });
    if (!categoryDoc) {
        categoryDoc = await Category.create({ name: trimmed, slug });
    }
    return categoryDoc._id;
};

// 1. PRODUCT POST API 
export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productName, brand, category, price, date } = req.body;

    if (!productName || !brand || !category || !price) {
        throw new ApiError(400, "Product name, brand, category, and price are required");
    }

    const localFilePath = req.file?.path;

    if (!localFilePath) {
        throw new ApiError(400, "Product avatar image is required");
    }

    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
        throw new ApiError(500, "Failed to upload product image to Cloudinary");
    }

    const brandObjectId = await resolveBrandId(brand);
    const categoryObjectId = await resolveCategoryId(category);

    if (!brandObjectId || !categoryObjectId) {
        throw new ApiError(400, "Invalid brand or category provided");
    }

    const product = await Product.create({
        productName: productName.trim(),
        avatar: cloudinaryResponse.secure_url,
        brand: brandObjectId,
        category: categoryObjectId,
        price: Number(price),
        date: date ? new Date(date) : Date.now(),
    });

    return res.status(201).json(
        new ApiResponse(201, product, "Product created successfully")
    );
});

// 2. PRODUCT GET API 
export const getAllProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 16 } = req.query;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find({})
        .populate("brand", "name slug")
        .populate("category", "name slug")
        .skip(skip)
        .limit(limitNumber)
        .lean();

    const totalProducts = await Product.countDocuments({});

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                pagination: {
                    totalProducts,
                    totalPages: Math.ceil(totalProducts / limitNumber),
                    currentPage: pageNumber,
                    limit: limitNumber,
                },
            },
            "All products fetched successfully"
        )
    );
});

// 3. PRODUCT SEARCH API 
export const searchProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, page = 1, limit = 16 } = req.query;

    if (!query || typeof query !== "string") {
        throw new ApiError(400, "Search query is required");
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const searchQuery = {
        productName: { $regex: query, $options: "i" },
    };

    const products = await Product.find(searchQuery)
        .populate("brand", "name slug")
        .populate("category", "name slug")
        .skip(skip)
        .limit(limitNumber)
        .lean();

    const totalProducts = await Product.countDocuments(searchQuery);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                pagination: {
                    totalProducts,
                    totalPages: Math.ceil(totalProducts / limitNumber),
                    currentPage: pageNumber,
                    limit: limitNumber,
                },
            },
            "Search results fetched successfully"
        )
    );
});

// 4. PRODUCT FILTER API 
export const filterProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { brand, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const filterQuery: any = {};

    if (brand) {
        filterQuery.brand = brand;
    }

    if (category) {
        filterQuery.category = category;
    }

    if (minPrice || maxPrice) {
        filterQuery.price = {};
        if (minPrice) filterQuery.price.$gte = Number(minPrice);
        if (maxPrice) filterQuery.price.$lte = Number(maxPrice);
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(filterQuery)
        .populate("brand", "name slug")
        .populate("category", "name slug")
        .skip(skip)
        .limit(limitNumber)
        .lean();

    const totalProducts = await Product.countDocuments(filterQuery);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                pagination: {
                    totalProducts,
                    totalPages: Math.ceil(totalProducts / limitNumber),
                    currentPage: pageNumber,
                    limit: limitNumber,
                },
            },
            "Filtered products fetched successfully"
        )
    );
});