// src/app/api/cigars/top-rated/route.ts
import { NextResponse } from 'next/server';
import { getCachedData, setCachedData, CACHE_KEYS, getCacheDuration } from '@/lib/redis';

export async function GET() {
  const startTime = Date.now();
  const cacheKey = CACHE_KEYS.TOP_RATED_CIGARS;
  const cacheDuration = getCacheDuration('top-rated');
  
  try {
    console.log(`🔍 [${new Date().toISOString()}] Attempting to fetch top-rated cigars`);
    console.log(`📦 Cache key: ${cacheKey}`);
    console.log(`⏱️ Cache duration: ${cacheDuration} seconds`);
    
    const cachedData = await getCachedData(cacheKey);
    
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`✅ Cache HIT - returning cached top-rated cigars`);
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
    
    console.log('❌ Cache MISS - fetching top-rated cigars from backend');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    console.log(`🌐 Fetching from: ${backendUrl}/api/cigars/top-rated`);
    
    // Add placeholder data handler
    if (backendUrl === 'https://placeholder-api.com') {
      console.log('Using placeholder data during build');
      const placeholderData = {
        cigars: [
          { 
            id: 1, 
            name: 'Placeholder Cigar 1', 
            slug: 'placeholder-cigar-1',
            rating: 4.9,
            brand: { name: 'Placeholder Brand', slug: 'placeholder-brand' },
            image: '/images/placeholder.jpg'
          },
          { 
            id: 2, 
            name: 'Placeholder Cigar 2', 
            slug: 'placeholder-cigar-2',
            rating: 4.8,
            brand: { name: 'Placeholder Brand', slug: 'placeholder-brand' },
            image: '/images/placeholder.jpg'
          },
          { 
            id: 3, 
            name: 'Placeholder Cigar 3', 
            slug: 'placeholder-cigar-3',
            rating: 4.7,
            brand: { name: 'Placeholder Brand', slug: 'placeholder-brand' },
            image: '/images/placeholder.jpg'
          }
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
    
    const response = await fetch(`${backendUrl}/api/cigars/top-rated`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('💾 Caching new top-rated cigars data');
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
    console.error('❌ Error fetching top-rated cigars:', error);
    console.error(`⚡ Error response time: ${responseTime}ms`);
    return NextResponse.json(
      { error: 'Failed to fetch top-rated cigars' },
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