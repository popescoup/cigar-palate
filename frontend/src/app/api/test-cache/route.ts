// src/app/api/test-cache/route.ts
import { redis, CACHE_KEYS } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all cached keys
    const keys = await redis.keys('ui:*');
    
    // Get values for each key
    const cacheData = await Promise.all(
      keys.map(async (key) => {
        const value = await redis.get(key);
        const ttl = await redis.ttl(key);
        return { key, value, ttl };
      })
    );
    
    return NextResponse.json(cacheData);
  } catch (error) {
    return NextResponse.json({ error: 'Cache test failed' }, { status: 500 });
  }
}