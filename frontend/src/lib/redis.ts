// src/lib/redis.ts

import Redis from 'ioredis';

export const CACHE_DURATIONS = {
  TOP_RATED: 30 * 60,    // 30 minutes
  TRENDING: 10 * 60,      // 10 minutes
} as const;

export const CACHE_KEYS = {
  TOP_RATED_CIGARS: 'ui:top-rated-cigars',
  TOP_RATED_BRANDS: 'ui:top-rated-brands',
  TRENDING_CIGARS: 'ui:trending-cigars',
  TRENDING_BRANDS: 'ui:trending-brands'
} as const;

const getRedisClient = () => {
  if (!process.env.UI_REDIS_URL) {
    throw new Error('UI_REDIS_URL is not defined');
  }
  return new Redis(process.env.UI_REDIS_URL);
};

export const redis = getRedisClient();

// Utility functions for caching
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cachedData = await redis.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error(`Error getting cached data for key ${key}:`, error);
    return null;
  }
}

export async function setCachedData(key: string, data: any, duration: number): Promise<void> {
  try {
    await redis.setex(key, duration, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting cached data for key ${key}:`, error);
  }
}

// Helper function to determine cache duration based on data type
export function getCacheDuration(type: 'top-rated' | 'trending'): number {
  return type === 'trending' ? CACHE_DURATIONS.TRENDING : CACHE_DURATIONS.TOP_RATED;
}