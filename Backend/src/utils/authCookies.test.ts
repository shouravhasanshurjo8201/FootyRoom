import assert from "node:assert/strict";
import test from "node:test";
import {
    getAccessTokenCookieOptions,
    getClearAuthCookieOptions,
    getRefreshTokenCookieOptions,
} from "./authCookies.js";

test("auth cookies expire at the matching JWT expiration time", () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const accessOptions = getAccessTokenCookieOptions(expiresAt);
    const refreshOptions = getRefreshTokenCookieOptions(expiresAt);

    assert.equal(accessOptions.expires, expiresAt);
    assert.equal(refreshOptions.expires, expiresAt);
    assert.ok(accessOptions.maxAge && accessOptions.maxAge > 0);
    assert.ok(refreshOptions.maxAge && refreshOptions.maxAge > 0);
    assert.equal(accessOptions.httpOnly, true);
    assert.equal(refreshOptions.httpOnly, true);
    assert.equal(accessOptions.path, "/");
    assert.equal(refreshOptions.path, "/");
});

test("clear-cookie options match the auth cookie scope", () => {
    const clearOptions = getClearAuthCookieOptions();

    assert.equal(clearOptions.httpOnly, true);
    assert.equal(clearOptions.path, "/");
    assert.equal(clearOptions.sameSite, "lax");
    assert.equal(clearOptions.maxAge, 0);
});
