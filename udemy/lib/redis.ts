import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const client = getRedis();
  if (!client) return { success: true, remaining: limit };

  const redisKey = `ratelimit:${key}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.expire(redisKey, windowSeconds);
  }
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}
