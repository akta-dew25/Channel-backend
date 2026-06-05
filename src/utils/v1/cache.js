// import { redisClient } from "../config/redis.js";

import { redisClient } from "../../config/redis.js";

export const redisKeys = {
  chatGroups: (orgId, userId, groupType = "all") =>
    `chat:groups:${orgId}:${userId}:${groupType}`,

  chatGroupById: (groupId) => `chat:group:${groupId}`,

  chatMessages: (groupId, page = 1, limit = 20) =>
    `chat:messages:${groupId}:${page}:${limit}`,
};

export const getCache = async (key) => {
  const data = await redisClient.get(key);

  return data ? JSON.parse(data) : null;
};

export const setCache = async (key, value, ttl = 600) => {
  await redisClient.set(key, JSON.stringify(value), "EX", ttl);
};

export const deleteCache = async (key) => {
  await redisClient.del(key);
};

export const delCachePattern = async (pattern) => {
  const keys = await redisClient.keys(pattern);

  if (keys.length) {
    await redis.del(keys);
  }
};
