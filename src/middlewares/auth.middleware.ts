import type { Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const verifyJWT = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: No access token found");
        }

        const decodedToken: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

        const user = await User.findById(decodedToken?._id).select("-refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid access token or expired");
    }
});