import type { CookieOptions } from "express";

const baseCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
};

export const getAccessTokenCookieOptions = (
  expiresAt: Date,
): CookieOptions => ({
  ...baseCookieOptions(),
  expires: expiresAt,
  maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
});

export const getRefreshTokenCookieOptions = (
  expiresAt: Date,
): CookieOptions => ({
  ...baseCookieOptions(),
  expires: expiresAt,
  maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
});

export const getClearAuthCookieOptions = (): CookieOptions => ({
  ...baseCookieOptions(),
  maxAge: 0,
});
