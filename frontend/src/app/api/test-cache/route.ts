// src/app/api/test-cache/route.ts
import { redis, CACHE_KEYS } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Redis is available
    if (!redis) {
      return NextResponse.json({
        status: 'error',
        message: 'Redis is not configured in this environment',
      }, { status: 503 });
    }
    
    // Get all cached keys
    const keys = await redis.keys('ui:*');
    
    // Store redis in a non-null variable that TypeScript can track through closures
    const redisClient = redis;
    
    // Get values for each key
    const cacheData = await Promise.all(
      keys.map(async (key) => {
        const value = await redisClient.get(key);
        const ttl = await redisClient.ttl(key);
        return { key, value, ttl };
      })
    );
    
    return NextResponse.json(cacheData);
  } catch (error) {
    return NextResponse.json({ error: 'Cache test failed' }, { status: 500 });
  }
}