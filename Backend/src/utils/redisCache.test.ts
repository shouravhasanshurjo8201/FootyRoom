import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductListCacheKey,
  cacheAside,
  getProductsCacheTtlSeconds,
} from "./redisCache.js";

test("product list cache keys separate versions and pagination", () => {
  assert.equal(
    buildProductListCacheKey("0", 1, 16),
    "products:list:v0:page:1:limit:16",
  );
  assert.notEqual(
    buildProductListCacheKey("0", 1, 16),
    buildProductListCacheKey("0", 2, 16),
  );
  assert.notEqual(
    buildProductListCacheKey("0", 1, 16),
    buildProductListCacheKey("0", 1, 20),
  );
  assert.notEqual(
    buildProductListCacheKey("0", 1, 16),
    buildProductListCacheKey("1", 1, 16),
  );
});

test("cache-aside loads from the source when Redis is disabled", async () => {
  const previousRedisEnabled = process.env.REDIS_ENABLED;
  process.env.REDIS_ENABLED = "false";
  let loadCount = 0;

  try {
    const result = await cacheAside(
      "products:list:v0:page:1:limit:16",
      { ttlSeconds: 30 },
      async () => {
        loadCount += 1;
        return { data: { products: [] }, success: true };
      },
    );

    assert.deepEqual(result, { data: { products: [] }, success: true });
    assert.equal(loadCount, 1);
  } finally {
    if (previousRedisEnabled === undefined) {
      delete process.env.REDIS_ENABLED;
    } else {
      process.env.REDIS_ENABLED = previousRedisEnabled;
    }
  }
});

test("product cache TTL defaults to five minutes and rejects invalid values", () => {
  const previousTtl = process.env.REDIS_PRODUCTS_TTL;
  try {
    delete process.env.REDIS_PRODUCTS_TTL;
    assert.equal(getProductsCacheTtlSeconds(), 300);
    process.env.REDIS_PRODUCTS_TTL = "60";
    assert.equal(getProductsCacheTtlSeconds(), 60);
    process.env.REDIS_PRODUCTS_TTL = "-1";
    assert.equal(getProductsCacheTtlSeconds(), 300);
  } finally {
    if (previousTtl === undefined) {
      delete process.env.REDIS_PRODUCTS_TTL;
    } else {
      process.env.REDIS_PRODUCTS_TTL = previousTtl;
    }
  }
});
