import { Redis } from "ioredis";

const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null, // Disable retry limit
}

export const redis = new Redis(redisConfig);

redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

export const createNewRedisConnection = () => {
    const newRedis = new Redis(redisConfig);
    return newRedis;
}