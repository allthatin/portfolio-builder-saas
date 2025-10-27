import { createClient, RedisClientType } from 'redis';

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

let redis: RedisClientType;

if (!globalForRedis.redis) {
  redis = createClient({
    url: process.env.REDIS_URL!,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          return new Error('Too many retries');
        }
        return Math.min(retries * 50, 2000);
      },
    },
  });

  redis.on('error', (err) => console.error('[Redis] Error:', err));
  redis.on('connect', () => console.log('[Redis] Connected'));

  redis.connect().catch(console.error);
  globalForRedis.redis = redis;
} else {
  redis = globalForRedis.redis;
}

export { redis };

// Cache utility functions
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value || typeof value !== 'string') {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[Redis] Error getting key ${key}:`, error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string, 
  value: T, 
  ttlSeconds?: number
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setEx(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.error(`[Redis] Error setting key ${key}:`, error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Redis] Error deleting key ${key}:`, error);
  }
}
