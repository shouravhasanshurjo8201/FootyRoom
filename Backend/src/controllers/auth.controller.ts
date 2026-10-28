import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthenticatedRequest } from "../types/index.js";
import {
    getAccessTokenCookieOptions,
    getClearAuthCookieOptions,
    getRefreshTokenCookieOptions,
} from "../utils/authCookies.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getTokenLifetimeSeconds = (environmentVariable: string, defaultValue: string): number => {
    const value = process.env[environmentVariable] ?? defaultValue;
    const match = /^([1-9]\d*)(s|m|h|d)$/.exec(value);
    if (!match) {
        throw new ApiError(500, `${environmentVariable} must use a duration such as 15m or 7d`);
    }

    const amount = Number(match[1]);
    const secondsPerUnit: Record<string, number> = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60,
    };
    const seconds = amount * secondsPerUnit[match[2]!];
    if (!Number.isSafeInteger(seconds)) {
        throw new ApiError(500, `${environmentVariable} is too large`);
    }
    return seconds;
};

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

    const accessExpiry = getTokenLifetimeSeconds("ACCESS_TOKEN_EXPIRY", "15m");
    const refreshExpiry = getTokenLifetimeSeconds("REFRESH_TOKEN_EXPIRY", "7d");
    const issuedAt = Math.floor(Date.now() / 1000);
    const accessTokenExpiresAt = new Date((issuedAt + accessExpiry) * 1000);
    const refreshTokenExpiresAt = new Date((issuedAt + refreshExpiry) * 1000);

    const accessToken = jwt.sign(
        {
            _id: user._id.toString(),
            email: user.email,
            iat: issuedAt,
        },
        accessSecret,
        {
            expiresIn: accessExpiry,
        }
    );

    const refreshToken = jwt.sign(
        {
            _id: user._id.toString(),
            iat: issuedAt,
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
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
    };
};

// POST /api/v1/auth/google
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

        const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } =
            await generateAccessAndRefreshTokens(user._id.toString());

        const safeUser = await User.findById(user._id)
            .select("-refreshToken")
            .lean();

        return res
            .status(200)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions(accessTokenExpiresAt))
            .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions(refreshTokenExpiresAt))
            .json(
                new ApiResponse(
                    200,
                    {
                        user: safeUser,
                        accessToken,
                        expiresIn: Math.ceil((accessTokenExpiresAt.getTime() - Date.now()) / 1000),
                    },
                    "Google login successful"
                )
            );
    }
);

// POST /api/v1/auth/refresh
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
            res.cookie("accessToken", "", getClearAuthCookieOptions());
            res.cookie("refreshToken", "", getClearAuthCookieOptions());

            throw new ApiError(
                401,
                "Refresh token is invalid or expired"
            );
        }

        const user = await User.findById(decoded._id);

        if (!user || !user.refreshToken) {
            res.cookie("accessToken", "", getClearAuthCookieOptions());
            res.cookie("refreshToken", "", getClearAuthCookieOptions());

            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            await User.updateOne(
                { _id: user._id },
                { $unset: { refreshToken: 1 } }
            );

            res.cookie("accessToken", "", getClearAuthCookieOptions());
            res.cookie("refreshToken", "", getClearAuthCookieOptions());

            throw new ApiError(
                401,
                "Refresh token has expired or has already been used (Security alert)"
            );
        }

        const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } =
            await generateAccessAndRefreshTokens(user._id.toString());

        return res
            .status(200)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions(accessTokenExpiresAt))
            .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions(refreshTokenExpiresAt))
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        expiresIn: Math.ceil((accessTokenExpiresAt.getTime() - Date.now()) / 1000),
                    },
                    "Access token refreshed successfully"
                )
            );
    }
);

// POST /api/v1/auth/logout
export const logoutUser = asyncHandler(
    async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken ??
            (typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined);

        res.cookie("accessToken", "", getClearAuthCookieOptions());
        res.cookie("refreshToken", "", getClearAuthCookieOptions());

        if (refreshToken) {
            await User.updateOne(
                { refreshToken },
                { $unset: { refreshToken: 1 } }
            );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Logged out successfully"
                )
            );
    }
);

// GET /api/v1/auth/me
export const getCurrentUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized request");
        }
        if (req.accessTokenExpiresAt === undefined) {
            throw new ApiError(401, "Invalid access token expiry");
        }

        return res.status(200).json({
            ...new ApiResponse(200, req.user, "Current user fetched successfully"),
            expiresIn: Math.max(
                0,
                req.accessTokenExpiresAt - Math.floor(Date.now() / 1000)
            ),
        });
    }
);