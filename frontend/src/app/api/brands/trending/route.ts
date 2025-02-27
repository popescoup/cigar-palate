// src/app/api/brands/trending/route.ts
import { NextResponse } from 'next/server';
import { getCachedData, setCachedData, CACHE_KEYS, getCacheDuration, CACHE_DURATIONS } from '@/lib/redis';

export async function GET() {
  const startTime = Date.now();
  const cacheKey = CACHE_KEYS.TRENDING_BRANDS;
  const cacheDuration = getCacheDuration('trending');
  
  try {
    console.log(`🔍 [${new Date().toISOString()}] Attempting to fetch trending brands`);
    console.log(`📦 Cache key: ${cacheKey}`);
    console.log(`⏱️ Cache duration: ${cacheDuration} seconds`);
    
    const cachedData = await getCachedData(cacheKey);
    
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`✅ Cache HIT - returning cached trending brands`);
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
    
    console.log('❌ Cache MISS - fetching trending brands from backend');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    console.log(`🌐 Fetching from: ${backendUrl}/api/brands/trending`);
    
    // Add this check for placeholder URL
    if (backendUrl === 'https://placeholder-api.com') {
      console.log('Using placeholder data during build');
      const placeholderData = {
        brands: [
          { id: 1, name: 'Placeholder Brand 1', count: 120, slug: 'placeholder-1' },
          { id: 2, name: 'Placeholder Brand 2', count: 95, slug: 'placeholder-2' },
          { id: 3, name: 'Placeholder Brand 3', count: 82, slug: 'placeholder-3' }
        ]
      };
      
      const responseTime = Date.now() - startTime;
      return NextResponse.json(placeholderData, {
        headers: {
          'X-Cache': 'MISS',
          'X-Placeholder': 'true',
          'X-Response-Time': `${responseTime}ms`
        }
      });
    }
    
    const response = await fetch(`${backendUrl}/api/brands/trending`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('💾 Caching new trending brands data');
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
    console.error('❌ Error fetching trending brands:', error);
    console.error(`⚡ Error response time: ${responseTime}ms`);
    return NextResponse.json(
      { error: 'Failed to fetch trending brands' },
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