import type { Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const verifyJWT = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authorization = req.header("Authorization");
    const token = req.cookies?.accessToken ??
        (authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined);

    if (!token) {
        throw new ApiError(401, "Unauthorized request: No access token found");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        throw new ApiError(500, "Access token secret is not configured");
    }

    let decodedToken: JwtPayload | string;
    try {
        decodedToken = jwt.verify(token, secret);
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(401, "Invalid access token or expired");
        }
        throw error;
    }

    if (typeof decodedToken === "string" || typeof decodedToken._id !== "string") {
        throw new ApiError(401, "Invalid access token payload");
    }

    const user = await User.findById(decodedToken._id).select("-refreshToken");
    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
});