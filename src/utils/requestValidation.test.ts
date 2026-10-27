import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "./ApiError.js";
import {
    parseNonNegativeNumber,
    parseOptionalDate,
    parsePagination,
    parseQueryString,
} from "./requestValidation.js";

test("parses non-negative prices, including zero", () => {
    assert.equal(parseNonNegativeNumber("0", "price"), 0);
    assert.equal(parseNonNegativeNumber("12.5", "price"), 12.5);
    assert.throws(() => parseNonNegativeNumber("-1", "price"), ApiError);
    assert.throws(() => parseNonNegativeNumber("nope", "price"), ApiError);
});

test("rejects malformed dates and parses valid dates", () => {
    assert.equal(parseOptionalDate(undefined, "date"), undefined);
    assert.ok(parseOptionalDate("2026-01-02", "date") instanceof Date);
    assert.throws(() => parseOptionalDate("not-a-date", "date"), ApiError);
});

test("validates scalar query parameters and bounded pagination", () => {
    assert.equal(parseQueryString("  camera ", "query"), "camera");
    assert.throws(() => parseQueryString(["one", "two"], "query"), ApiError);
    assert.deepEqual(parsePagination("2", "50"), { page: 2, limit: 50 });
    assert.throws(() => parsePagination("0", "10"), ApiError);
    assert.throws(() => parsePagination("1", "101"), ApiError);
    assert.throws(() => parsePagination("9007199254740991", "100"), ApiError);
});
