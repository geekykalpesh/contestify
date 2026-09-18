const Redis = require("ioredis");

const inMemoryStore = new Map();
const inMemorySets = new Map();

let redisClient = null;
let isRedisConnected = false;

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  try {
    console.log(`[User Service] Connecting to Redis at ${redisUrl}...`);
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      connectTimeout: 5000
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      console.log("[User Service] ✅ Connected to Redis Cache Server successfully!");
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      console.warn("[User Service] Redis Connection Notice (using in-memory fallback):", err.message);
    });
  } catch (err) {
    console.warn("[User Service] Failed to initialize Redis client:", err.message);
  }
};

const addToSet = async (key, value) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.sadd(key, value.toString());
      return;
    } catch (e) {}
  }
  if (!inMemorySets.has(key)) {
    inMemorySets.set(key, new Set());
  }
  inMemorySets.get(key).add(value.toString());
};

const getSetMembers = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      return await redisClient.smembers(key);
    } catch (e) {}
  }
  if (!inMemorySets.has(key)) return [];
  return Array.from(inMemorySets.get(key));
};

const setCache = async (key, value, ttlSeconds = 60) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (e) {}
  }
  inMemoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
};

const getCache = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {}
  }
  const item = inMemoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    inMemoryStore.delete(key);
    return null;
  }
  return item.value;
};

const clearCachePattern = async (pattern = "feed:cache:*") => {
  if (isRedisConnected && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (e) {}
  }
  inMemoryStore.clear();
};

const clearUserViewedSet = async (userId) => {
  const key = `user:viewed:${userId}`;
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (e) {}
  }
  inMemorySets.delete(key);
};

module.exports = {
  initRedis,
  addToSet,
  getSetMembers,
  setCache,
  getCache,
  clearCachePattern,
  clearUserViewedSet
};
