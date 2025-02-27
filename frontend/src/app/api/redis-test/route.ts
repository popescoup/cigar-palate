// src/app/api/redis-test/route.ts
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(request: Request) {
  try {
    // Check if Redis is available
    if (!redis) {
      return NextResponse.json({
        status: 'error',
        message: 'Redis is not configured in this environment',
        connected: false
      }, { status: 503 });
    }
    
    // Clear any existing data
    await redis.flushdb();
    
    // Try to write some data
    const testKey = 'test:connection';
    await redis.set(testKey, 'Hello Redis!');
    
    // Read it back
    const value = await redis.get(testKey);
    
    // Get all keys
    const allKeys = await redis.keys('*');
    
    // Get Redis info
    const info = await redis.info();
    
    return NextResponse.json({
      status: 'success',
      value,
      allKeys,
      redisInfo: info,
      connected: true
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      connected: false
    }, { status: 500 });
  }
}