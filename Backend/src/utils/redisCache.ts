import { createClient, type RedisClientType } from "redis";

type CacheOptions = {
  ttlSeconds: number;
};

const isRedisEnabled = () =>
  process.env.REDIS_ENABLED?.toLowerCase() === "true";
const productCacheVersionKey = "products:list:version";
const inFlightLoads = new Map<string, Promise<unknown>>();
let missingRedisUrlReported = false;
let invalidTtlReported = false;

let client: RedisClientType | undefined;
let connectionPromise: Promise<void> | undefined;

const getClient = (): RedisClientType | undefined => {
  if (!isRedisEnabled()) {
    return undefined;
  }

  if (client) {
    return client;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    if (!missingRedisUrlReported) {
      console.error(
        "[CACHE ERROR] REDIS_ENABLED is true but REDIS_URL is not configured",
      );
      missingRedisUrlReported = true;
    }
    return undefined;
  }

  client = createClient({
    url,
    socket: {
      connectTimeout: 5000,
      timeout: 5000,
      reconnectStrategy: (retries) =>
        Math.min(250 * 2 ** Math.min(retries, 4), 5000),
    },
  });
  client.on("error", (error) => {
    console.error("[CACHE ERROR] Redis client error:", error.message);
  });

  return client;
};

export const connectRedis = async (): Promise<void> => {
  const redisClient = getClient();
  if (!redisClient) {
    if (!isRedisEnabled()) {
      console.info("[CACHE] Redis caching is disabled");
    }
    return;
  }
  if (redisClient.isReady || redisClient.isOpen) {
    return connectionPromise;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = redisClient
    .connect()
    .then(() => {
      console.info("[CACHE] Connected to Redis");
    })
    .catch((error: unknown) => {
      console.error(
        "[CACHE ERROR] Initial Redis connection failed; cache will fail open:",
        error,
      );
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  return connectionPromise;
};

export const closeRedis = async (): Promise<void> => {
  if (client?.isOpen) {
    await client.close();
    console.info("[CACHE] Redis connection closed");
  }
};

export const getProductListCacheVersion = async (): Promise<
  string | undefined
> => {
  const redisClient = getClient();
  if (!redisClient?.isReady) {
    return undefined;
  }

  try {
    return (await redisClient.get(productCacheVersionKey)) ?? "0";
  } catch (error) {
    console.error("[CACHE ERROR] Could not read product cache version:", error);
    return undefined;
  }
};

export const invalidateProductListCache = async (): Promise<void> => {
  if (!isRedisEnabled()) {
    return;
  }

  const redisClient = getClient();
  if (!redisClient?.isReady) {
    console.error(
      "[CACHE ERROR] Product-list cache invalidation skipped because Redis is unavailable",
    );
    return;
  }

  try {
    await redisClient.incr(productCacheVersionKey);
    console.info("[CACHE INVALIDATED] Product-list cache namespace");
  } catch (error) {
    console.error(
      "[CACHE ERROR] Could not invalidate product-list cache:",
      error,
    );
  }
};

export const buildProductListCacheKey = (
  version: string,
  page: number,
  limit: number,
): string => `products:list:v${version}:page:${page}:limit:${limit}`;

export const getProductsCacheTtlSeconds = (): number => {
  const rawTtl = process.env.REDIS_PRODUCTS_TTL;
  if (rawTtl === undefined) {
    return 300;
  }

  const ttl = Number(rawTtl);
  if (!Number.isSafeInteger(ttl) || ttl <= 0) {
    if (!invalidTtlReported) {
      console.error(
        "[CACHE ERROR] REDIS_PRODUCTS_TTL must be a positive integer; using 300 seconds",
      );
      invalidTtlReported = true;
    }
    return 300;
  }
  return ttl;
};

const logCacheEvent = (message: string): void => {
  if (process.env.NODE_ENV !== "production") {
    console.info(message);
  }
};

export const cacheAside = async <T>(
  key: string,
  options: CacheOptions,
  load: () => Promise<T>,
): Promise<T> => {
  const redisClient = getClient();
  if (!redisClient?.isReady) {
    return load();
  }

  try {
    const cachedValue = await redisClient.get(key);
    if (cachedValue !== null) {
      try {
        logCacheEvent(`[CACHE HIT] ${key}`);
        return JSON.parse(cachedValue) as T;
      } catch (error) {
        console.error(`[CACHE ERROR] Invalid cached JSON for ${key}:`, error);
      }
    }
  } catch (error) {
    console.error(
      `[CACHE ERROR] Redis GET failed for ${key}; loading from MongoDB:`,
      error,
    );
  }

  logCacheEvent(`[CACHE MISS] ${key}`);
  const existingLoad = inFlightLoads.get(key) as Promise<T> | undefined;
  if (existingLoad) {
    return existingLoad;
  }

  const loadPromise = (async () => {
    const value = await load();
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: options.ttlSeconds,
      });
      logCacheEvent(`[CACHE SET] ${key} (TTL ${options.ttlSeconds}s)`);
    } catch (error) {
      console.error(
        `[CACHE ERROR] Redis SET failed for ${key}; returning MongoDB result:`,
        error,
      );
    }
    return value;
  })();

  inFlightLoads.set(key, loadPromise);
  try {
    return await loadPromise;
  } finally {
    inFlightLoads.delete(key);
  }
};
