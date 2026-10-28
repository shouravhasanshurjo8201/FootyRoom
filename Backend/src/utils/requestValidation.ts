import { ApiError } from "./ApiError.js";

export const parseNonEmptyString = (value: unknown, fieldName: string): string => {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new ApiError(400, `${fieldName} is required`);
    }

    return value.trim();
};

export const parseNonNegativeNumber = (value: unknown, fieldName: string): number => {
    if (
        (typeof value !== "number" && typeof value !== "string") ||
        (typeof value === "string" && value.trim() === "")
    ) {
        throw new ApiError(400, `${fieldName} must be a non-negative number`);
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new ApiError(400, `${fieldName} must be a non-negative number`);
    }

    return parsed;
};

export const parseOptionalDate = (value: unknown, fieldName: string): Date | undefined => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
        throw new ApiError(400, `${fieldName} must be a valid date`);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new ApiError(400, `${fieldName} must be a valid date`);
    }

    return parsed;
};

export const parseQueryString = (value: unknown, fieldName: string): string | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
        throw new ApiError(400, `${fieldName} must be a single non-empty value`);
    }

    return value.trim();
};

export const parsePagination = (
    pageValue: unknown,
    limitValue: unknown,
    defaults: { page: number; limit: number } = { page: 1, limit: 16 },
    maxLimit = 100
) => {
    const parseInteger = (value: unknown, fieldName: string, fallback: number, max?: number) => {
        if (value === undefined) {
            return fallback;
        }

        const stringValue = typeof value === "number" ? String(value) : value;
        if (typeof stringValue !== "string" || !/^[1-9]\d*$/.test(stringValue)) {
            throw new ApiError(400, `${fieldName} must be a positive integer`);
        }

        const parsed = Number(stringValue);
        if (!Number.isSafeInteger(parsed) || (max !== undefined && parsed > max)) {
            throw new ApiError(400, max === undefined
                ? `${fieldName} is too large`
                : `${fieldName} must not exceed ${max}`);
        }

        return parsed;
    };

    const page = parseInteger(pageValue, "page", defaults.page);
    const limit = parseInteger(limitValue, "limit", defaults.limit, maxLimit);
    if (!Number.isSafeInteger((page - 1) * limit)) {
        throw new ApiError(400, "Requested page is too large");
    }

    return { page, limit };
};
