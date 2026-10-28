import { rm } from "node:fs/promises";
import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const errorHandler: ErrorRequestHandler = async (error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (req.file?.path) {
        try {
            await rm(req.file.path, { force: true });
        } catch (cleanupError) {
            console.error("Failed to remove temporary upload:", cleanupError);
        }
    }

    let apiError: ApiError;
    if (error instanceof ApiError) {
        apiError = error;
    } else if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        error.statusCode === 400 &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        apiError = new ApiError(400, error.message);
    } else if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Uploaded image must be 5 MB or smaller"
            : "Invalid image upload";
        apiError = new ApiError(error.code === "LIMIT_FILE_SIZE" ? 413 : 400, message);
    } else if (error instanceof mongoose.Error.ValidationError) {
        apiError = new ApiError(400, "Request validation failed", Object.values(error.errors).map(({ message }) => message));
    } else if (error instanceof mongoose.Error.CastError) {
        apiError = new ApiError(400, "Invalid value provided");
    } else if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        apiError = new ApiError(409, "A record with these details already exists");
    } else if (typeof error === "object" && error !== null && "type" in error) {
        if (error.type === "entity.parse.failed") {
            apiError = new ApiError(400, "Malformed JSON request body");
        } else if (error.type === "entity.too.large") {
            apiError = new ApiError(413, "Request body is too large");
        } else {
            console.error("Unhandled request error:", error);
            apiError = new ApiError(500, "Internal server error");
        }
    } else {
        console.error("Unhandled request error:", error);
        apiError = new ApiError(500, "Internal server error");
    }

    res.status(apiError.statusCode).json(
        new ApiResponse(apiError.statusCode, apiError.data, apiError.message)
    );
};
