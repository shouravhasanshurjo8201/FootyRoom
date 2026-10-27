import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

test("reports readiness and returns JSON for malformed requests", async () => {
    process.env.CORS_ORIGIN = "http://localhost:3000";
    const { app } = await import("../app.js");
    const server = createServer(app);

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });

    try {
        const address = server.address();
        assert.ok(address && typeof address !== "string");
        const baseUrl = `http://127.0.0.1:${address.port}`;

        const readyResponse = await fetch(`${baseUrl}/api/v1/health`, {
            headers: { Origin: "http://localhost:3000" },
        });
        assert.equal(readyResponse.status, 503);
        assert.equal(readyResponse.headers.get("access-control-allow-origin"), "http://localhost:3000");

        const malformedResponse = await fetch(`${baseUrl}/api/v1/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Origin: "http://localhost:3000",
            },
            body: "{",
        });
        assert.equal(malformedResponse.status, 400);
        assert.equal(
            malformedResponse.headers.get("access-control-allow-origin"),
            "http://localhost:3000"
        );
        assert.equal(malformedResponse.headers.get("content-type")?.includes("application/json"), true);
        assert.equal((await malformedResponse.json()).success, false);

        const notFoundResponse = await fetch(`${baseUrl}/api/v1/not-found`);
        assert.equal(notFoundResponse.status, 404);
        assert.equal((await notFoundResponse.json()).message, "Route not found");
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});
