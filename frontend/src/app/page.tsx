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
      trendingCigars: {
        cigars: [
          { 
            id: 1, 
            name: 'Trending Placeholder Cigar 1', 
            slug: 'trending-placeholder-1',
            views: 350,
            brand: { name: 'Placeholder Brand', slug: 'placeholder-brand' },
            image: '/images/placeholder.jpg'
          },
          { 
            id: 2, 
            name: 'Trending Placeholder Cigar 2', 
            slug: 'trending-placeholder-2',
            views: 320,
            brand: { name: 'Placeholder Brand', slug: 'placeholder-brand' },
            image: '/images/placeholder.jpg'
          }
        ]
      },
      topRatedCigars: {
        cigars: [
          { 
            id: 1, 
            name: 'Top Rated Placeholder Cigar 1', 
            slug: 'top-rated-placeholder-1',
            rating: 4.9,
            brand: { name: 'Placeholder Brand', slug: 'placeholder-brand' },
            image: '/images/placeholder.jpg'
          },
          { 
            id: 2, 
            name: 'Top Rated Placeholder Cigar 2', 
            slug: 'top-rated-placeholder-2',
            rating: 4.8,
            brand: { name: 'Placeholder Brand', slug: 'placeholder-brand' },
            image: '/images/placeholder.jpg'
          }
        ]
      }
    };
  }
  
  const [trendingCigars, topRatedCigars] = await Promise.all([
    fetch(`${backendUrl}/api/cigars/trending?limit=4`, { next: { revalidate: 3600 } }),
    fetch(`${backendUrl}/api/cigars/top-rated?limit=4`, { next: { revalidate: 3600 } })
  ]);

  return {
    trendingCigars: await trendingCigars.json(),
    topRatedCigars: await topRatedCigars.json()
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