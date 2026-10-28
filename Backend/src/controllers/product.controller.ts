import type { Response } from "express";
import { Types } from "mongoose";
import { Product } from "../models/product.model.js";
import { Brand } from "../models/brand.model.js";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    parseNonEmptyString,
    parseNonNegativeNumber,
    parseOptionalDate,
    parsePagination,
    parseQueryString,
} from "../utils/requestValidation.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import type { AuthenticatedRequest } from "../types/index.js";

const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-");
type ProductFilter = {
    productName?: { $regex: string; $options: "i" };
    brand?: Types.ObjectId;
    category?: Types.ObjectId;
    price?: { $gte?: number; $lte?: number };
};

const resolveBrandId = async (input: string): Promise<Types.ObjectId> => {
    if (/^[0-9a-fA-F]{24}$/.test(input)) {
        const brand = await Brand.findById(input);
        if (!brand) throw new ApiError(400, "Brand does not exist");
        return brand._id;
    }

    const name = parseNonEmptyString(input, "brand");
    const slug = slugify(name);
    const brand = await Brand.findOne({ slug }) ??
        await Brand.create({ name, slug });
    return brand._id;
};

const resolveCategoryId = async (input: string): Promise<Types.ObjectId> => {
    if (/^[0-9a-fA-F]{24}$/.test(input)) {
        const category = await Category.findById(input);
        if (!category) throw new ApiError(400, "Category does not exist");
        return category._id;
    }

    const name = parseNonEmptyString(input, "category");
    const slug = slugify(name);
    const category = await Category.findOne({ slug }) ??
        await Category.create({ name, slug });
    return category._id;
};

const resolveExistingBrandId = async (input: string): Promise<Types.ObjectId> => {
    if (/^[0-9a-fA-F]{24}$/.test(input)) {
        const brand = await Brand.findById(input);
        if (!brand) throw new ApiError(400, "Brand does not exist");
        return brand._id;
    }

    const brand = await Brand.findOne({ slug: slugify(input) });
    if (!brand) throw new ApiError(400, "Brand does not exist");
    return brand._id;
};

const resolveExistingCategoryId = async (input: string): Promise<Types.ObjectId> => {
    if (/^[0-9a-fA-F]{24}$/.test(input)) {
        const category = await Category.findById(input);
        if (!category) throw new ApiError(400, "Category does not exist");
        return category._id;
    }

    const category = await Category.findOne({ slug: slugify(input) });
    if (!category) throw new ApiError(400, "Category does not exist");
    return category._id;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPaginatedProducts = async (
    filter: ProductFilter,
    pageValue: unknown,
    limitValue: unknown,
    sortDirection?: 1 | -1,
) => {
    const { page, limit } = parsePagination(pageValue, limitValue);
    const skip = (page - 1) * limit;
    const [products, totalProducts] = await Promise.all([
        Product.find(filter)
            .populate("brand", "name slug")
            .populate("category", "name slug")
            .sort(sortDirection ? { price: sortDirection, _id: sortDirection } : {})
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    return {
        products,
        pagination: {
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            limit,
        },
    };
};

const getProductFilter = async (
    brandValue: unknown,
    categoryValue: unknown,
    minPriceValue: unknown,
    maxPriceValue: unknown,
): Promise<ProductFilter> => {
    const brandInput = parseQueryString(brandValue, "Brand");
    const categoryInput = parseQueryString(categoryValue, "Category");
    const minPriceText = parseQueryString(minPriceValue, "Minimum price");
    const maxPriceText = parseQueryString(maxPriceValue, "Maximum price");
    const filter: ProductFilter = {};

    if (brandInput) filter.brand = await resolveExistingBrandId(brandInput);
    if (categoryInput) filter.category = await resolveExistingCategoryId(categoryInput);

    if (minPriceText !== undefined || maxPriceText !== undefined) {
        const minPrice = minPriceText === undefined
            ? undefined
            : parseNonNegativeNumber(minPriceText, "Minimum price");
        const maxPrice = maxPriceText === undefined
            ? undefined
            : parseNonNegativeNumber(maxPriceText, "Maximum price");
        if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
            throw new ApiError(400, "Minimum price cannot exceed maximum price");
        }
        filter.price = {
            ...(minPrice !== undefined ? { $gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
        };
    }

    return filter;
};

const getSortDirection = (sortValue: unknown): 1 | -1 | undefined => {
    const sort = parseQueryString(sortValue, "Sort");
    if (sort === undefined) return undefined;
    if (sort === "asc") return 1;
    if (sort === "desc") return -1;
    throw new ApiError(400, "Sort must be either asc or desc");
};

export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const productName = parseNonEmptyString(req.body?.productName, "Product name");
    const brandInput = parseNonEmptyString(req.body?.brand, "Brand");
    const categoryInput = parseNonEmptyString(req.body?.category, "Category");
    const price = parseNonNegativeNumber(req.body?.price, "Price");
    const date = parseOptionalDate(req.body?.date, "Date");
    const localFilePath = req.file?.path;

    if (!localFilePath) {
        throw new ApiError(400, "Product avatar image is required");
    }

    const [brand, category] = await Promise.all([
        resolveBrandId(brandInput),
        resolveCategoryId(categoryInput),
    ]);
    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    const product = await Product.create({
        productName,
        avatar: cloudinaryResponse.secure_url,
        brand,
        category,
        price,
        ...(date ? { date } : {}),
    });

    return res.status(201).json(
        new ApiResponse(201, product, "Product created successfully")
    );
});

export const getAllProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await getPaginatedProducts({}, req.query.page, req.query.limit);
    return res.status(200).json(new ApiResponse(200, result, "All products fetched successfully"));
});

export const searchProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = parseQueryString(req.query.query, "Search query");
    if (!query) {
        throw new ApiError(400, "Search query is required");
    }
    if (query.length > 100) {
        throw new ApiError(400, "Search query must be 100 characters or fewer");
    }

    const filter = await getProductFilter(
        req.query.brand,
        req.query.category,
        req.query.minPrice,
        req.query.maxPrice,
    );
    filter.productName = { $regex: escapeRegex(query), $options: "i" };
    const result = await getPaginatedProducts(
        filter,
        req.query.page,
        req.query.limit,
        getSortDirection(req.query.sort),
    );
    return res.status(200).json(new ApiResponse(200, result, "Search results fetched successfully"));
});

export const filterProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filter = await getProductFilter(
        req.query.brand,
        req.query.category,
        req.query.minPrice,
        req.query.maxPrice,
    );
    const result = await getPaginatedProducts(
        filter,
        req.query.page,
        req.query.limit,
        getSortDirection(req.query.sort),
    );
    return res.status(200).json(new ApiResponse(200, result, "Filtered products fetched successfully"));
});
