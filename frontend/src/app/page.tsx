// app/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { CollectionSectionLoading } from '@/components/sections/CollectionSection';
import HeroSection from '@/components/sections/HeroSection';

const TrendingDiscussions = dynamic(
  () => import('@/components/sections/TrendingDiscussions'),
  {
    loading: () => (
      <div className="bg-white py-8 sm:py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-100 rounded w-1/3 mx-auto" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
);

const ClientHomePage = dynamic(
  () => import('@/components/ClientHomePage'),
  {
    loading: () => <CollectionSectionLoading />
  }
);

const PageWrapper = dynamic(() => import('@/components/PageWrapper'), {
  ssr: false
});

async function getData() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  
  // Add check for placeholder API
  if (backendUrl === 'https://placeholder-api.com') {
    console.log('Using placeholder data for home page during build');
    return {
      trendingCigars: [
        { 
          id: 1, 
          name: 'Trending Placeholder Cigar 1', 
          brand: { name: 'Placeholder Brand' },
          image_key: '/images/placeholder.jpg',
          averageRating: 4.5,
          numberOfRatings: 100
        },
        { 
          id: 2, 
          name: 'Trending Placeholder Cigar 2', 
          brand: { name: 'Placeholder Brand' },
          image_key: '/images/placeholder.jpg',
          averageRating: 4.3,
          numberOfRatings: 80
        }
      ],
      topRatedCigars: [
        { 
          id: 1, 
          name: 'Top Rated Placeholder Cigar 1', 
          brand: { name: 'Placeholder Brand' },
          image_key: '/images/placeholder.jpg',
          averageRating: 4.9,
          numberOfRatings: 150
        },
        { 
          id: 2, 
          name: 'Top Rated Placeholder Cigar 2', 
          brand: { name: 'Placeholder Brand' },
          image_key: '/images/placeholder.jpg',
          averageRating: 4.8,
          numberOfRatings: 130
        }
      ],
      topRatedBrands: [
        {
          id: 1,
          name: 'Top Rated Brand 1',
          image_key: '/images/placeholder.jpg',
          avgRating: 4.8,
          cigarCount: 25
        },
        {
          id: 2,
          name: 'Top Rated Brand 2',
          image_key: '/images/placeholder.jpg',
          avgRating: 4.7,
          cigarCount: 18
        }
      ],
      trendingBrands: [
        {
          id: 1,
          name: 'Trending Brand 1',
          image_key: '/images/placeholder.jpg',
          avgRating: 4.6,
          cigarCount: 30
        },
        {
          id: 2,
          name: 'Trending Brand 2',
          image_key: '/images/placeholder.jpg',
          avgRating: 4.5,
          cigarCount: 22
        }
      ]
    };
  }
  
  // Fetch all four data collections in parallel
  const [trendingCigars, topRatedCigars, topRatedBrands, trendingBrands] = await Promise.all([
    fetch(`${backendUrl}/api/cigars/trending?limit=10`, { 
      next: { revalidate: 3600 },
      headers: { 'Cache-Control': 'no-cache' }
    }),
    fetch(`${backendUrl}/api/cigars/top-rated?limit=10`, { 
      next: { revalidate: 3600 },
      headers: { 'Cache-Control': 'no-cache' }
    }),
    fetch(`${backendUrl}/api/brands/top-rated?limit=10`, { 
      next: { revalidate: 3600 },
      headers: { 'Cache-Control': 'no-cache' }
    }),
    fetch(`${backendUrl}/api/brands/trending?limit=10`, { 
      next: { revalidate: 3600 },
      headers: { 'Cache-Control': 'no-cache' }
    })
  ]);

  // Handle potential fetch errors
  if (!trendingCigars.ok || !topRatedCigars.ok || !topRatedBrands.ok || !trendingBrands.ok) {
    console.error('Error fetching collection data');
    return {
      trendingCigars: [],
      topRatedCigars: [],
      topRatedBrands: [],
      trendingBrands: []
    };
  }

  // Parse all responses
  return {
    trendingCigars: await trendingCigars.json(),
    topRatedCigars: await topRatedCigars.json(),
    topRatedBrands: await topRatedBrands.json(),
    trendingBrands: await trendingBrands.json()
  };
}

export default async function Page() {
  const initialData = await getData();
  
  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50">
        <HeroSection />
        <Suspense fallback={null}>
          <TrendingDiscussions />
        </Suspense>
        <ClientHomePage initialData={initialData} />
      </div>
    </PageWrapper>
  );
}