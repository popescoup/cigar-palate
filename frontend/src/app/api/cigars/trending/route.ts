// src/app/api/cigars/trending/route.ts
import { NextResponse } from 'next/server';
import { getCachedData, setCachedData, CACHE_KEYS, getCacheDuration, CACHE_DURATIONS } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const cacheKey = CACHE_KEYS.TRENDING_CIGARS;
  const cacheDuration = getCacheDuration('trending');
  
  try {
    console.log(`🔍 [${new Date().toISOString()}] Attempting to fetch trending cigars`);
    console.log(`📦 Cache key: ${cacheKey}`);
    console.log(`⏱️ Cache duration: ${cacheDuration} seconds`);
    
    const cachedData = await getCachedData(cacheKey);
    
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`✅ Cache HIT - returning cached trending cigars`);
      console.log(`⚡ Response time: ${responseTime}ms`);
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-TTL': cacheDuration.toString(),
          'X-Cache-Key': cacheKey,
          'X-Cache-Time': new Date().toISOString(),
          'X-Response-Time': `${responseTime}ms`,
          'X-Backend-URL': process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
        }
      });
    }
    
    console.log('❌ Cache MISS - fetching trending cigars from backend');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    console.log(`🌐 Fetching from: ${backendUrl}/api/cigars/trending`);
    
    const response = await fetch(`${backendUrl}/api/cigars/trending`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('💾 Caching new trending cigars data');
    await setCachedData(cacheKey, data, cacheDuration);

    const responseTime = Date.now() - startTime;
    console.log(`⚡ Response time: ${responseTime}ms`);
    
    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-TTL': cacheDuration.toString(),
        'X-Cache-Key': cacheKey,
        'X-Cache-Time': new Date().toISOString(),
        'X-Response-Time': `${responseTime}ms`,
        'X-Backend-URL': backendUrl
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Error fetching trending cigars:', error);
    console.error(`⚡ Error response time: ${responseTime}ms`);
    return NextResponse.json(
      { error: 'Failed to fetch trending cigars' },
      { 
        status: 500,
        headers: {
          'X-Error-Time': new Date().toISOString(),
          'X-Response-Time': `${responseTime}ms`
        }
      }
    );
  }
}