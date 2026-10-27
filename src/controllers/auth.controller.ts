import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt, { type SignOptions } from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthenticatedRequest } from "../types/index.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getAccessTokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 4 * 60 * 1000,
});

const getRefreshTokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

const clearCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
});

// Environment validation
const getTokenSecrets = () => {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!accessSecret || !refreshSecret) {
        throw new ApiError(500, "JWT secrets are not configured");
    }

    return { accessSecret, refreshSecret };
};

const getGoogleClientId = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        throw new ApiError(500, "Google Client ID is not configured");
    }

    return clientId;
};

// Generate Access Token & Refresh Token
const generateAccessAndRefreshTokens = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { accessSecret, refreshSecret } = getTokenSecrets();

    const accessExpiry = (
        process.env.ACCESS_TOKEN_EXPIRY || "4m"
    ) as SignOptions["expiresIn"];

    const refreshExpiry = (
        process.env.REFRESH_TOKEN_EXPIRY || "7d"
    ) as SignOptions["expiresIn"];

    const accessToken = jwt.sign(
        {
            _id: user._id.toString(),
            email: user.email,
        },
        accessSecret,
        {
            expiresIn: accessExpiry,
        }
    );

    const refreshToken = jwt.sign(
        {
            _id: user._id.toString(),
        },
        refreshSecret,
        {
            expiresIn: refreshExpiry,
        }
    );

    user.refreshToken = refreshToken;

    await user.save({
        validateBeforeSave: false,
    });

    return {
        accessToken,
        refreshToken,
    };
};

// 1. POST /api/v1/auth/google
export const googleAuth = asyncHandler(
    async (req: Request, res: Response) => {
        const { idToken } = req.body as {
            idToken?: string;
        };

        if (!idToken || typeof idToken !== "string") {
            throw new ApiError(400, "Google ID Token is required");
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: getGoogleClientId(),
        });
        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            !payload.email_verified
        ) {
            throw new ApiError(
                401,
                "Invalid Google token or unverified email"
            );
        }

        const googleId = payload.sub;
        const email = payload.email.toLowerCase();
        const name = payload.name?.trim() || email;
        const avatar = payload.picture;

        let user = await User.findOne({ googleId });

        if (user) {
            if (user.email !== email) {
                throw new ApiError(
                    401,
                    "Google account identity mismatch"
                );
            }

            user.name = name;
            if (avatar) user.avatar = avatar;

            await user.save();
        } else {
            const existingEmailUser = await User.findOne({ email });

            if (existingEmailUser) {
                throw new ApiError(
                    409,
                    "This email is already associated with another account"
                );
            }

            try {
                user = await User.create({
                    name,
                    email,
                    avatar,
                    googleId,
                });
            } catch (error) {
                const mongoError = error as {
                    code?: number;
                };

                if (mongoError.code === 11000) {
                    throw new ApiError(
                        409,
                        "Account already exists. Please try logging in again"
                    );
                }

                throw error;
            }
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id.toString());

        const safeUser = await User.findById(user._id)
            .select("-refreshToken")
            .lean();

        return res
            .status(200)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
            .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions())
            .json(
                new ApiResponse(
                    200,
                    {
                        user: safeUser,
                        accessToken,
                    },
                    "Google login successful"
                )
            );
    }
);

// 2. POST /api/v1/auth/refresh
export const refreshAccessToken = asyncHandler(
    async (req: Request, res: Response) => {
        const incomingRefreshToken =
            req.cookies?.refreshToken ||
            req.body?.refreshToken;

        if (
            !incomingRefreshToken ||
            typeof incomingRefreshToken !== "string"
        ) {
            throw new ApiError(
                401,
                "Unauthorized: Refresh token is required"
            );
        }

        const { refreshSecret } = getTokenSecrets();

        let decoded: jwt.JwtPayload;

        try {
            const verified = jwt.verify(
                incomingRefreshToken,
                refreshSecret
            );

            if (
                typeof verified === "string" ||
                typeof verified._id !== "string"
            ) {
                throw new ApiError(401, "Invalid refresh token payload");
            }

            decoded = verified;
        } catch {
            res.clearCookie("accessToken", clearCookieOptions());
            res.clearCookie("refreshToken", clearCookieOptions());

            throw new ApiError(
                401,
                "Refresh token is invalid or expired"
            );
        }

        const user = await User.findById(decoded._id);

        if (!user || !user.refreshToken) {
            res.clearCookie("accessToken", clearCookieOptions());
            res.clearCookie("refreshToken", clearCookieOptions());

            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            user.refreshToken = undefined as any;
            await user.save({ validateBeforeSave: false });

            res.clearCookie("accessToken", clearCookieOptions());
            res.clearCookie("refreshToken", clearCookieOptions());

            throw new ApiError(
                401,
                "Refresh token has expired or has already been used (Security alert)"
            );
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id.toString());

        return res
            .status(200)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
            .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions())
            .json(
                new ApiResponse(
                    200,
                    { accessToken },
                    "Access token refreshed successfully"
                )
            );
    }
);

// 3. POST /api/v1/auth/logout
export const logoutUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user?._id) {
            throw new ApiError(401, "Unauthorized request");
        }

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1,
                },
            }
        );

        return res
            .status(200)
            .clearCookie("accessToken", clearCookieOptions())
            .clearCookie("refreshToken", clearCookieOptions())
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Logged out successfully"
                )
            );
    }
);

// 4. GET /api/v1/auth/me
export const getCurrentUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized request");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        );
    }
);