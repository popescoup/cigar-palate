'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import HorizontalScrollSection from '@/components/sections/horizontal-scroll-section';
import type { Cigar } from '@/types/cigars';
import type { Brand, ScrollItem } from '@/types/collection';
import { Loader2 } from 'lucide-react';

// Skeleton loading component for a single card
const CardSkeleton = () => (
  <div className="shrink-0 w-[280px] sm:w-80">
    <Card className="h-full">
      <CardContent className="p-0">
        <div className="relative">
          {/* Image skeleton */}
          <Skeleton className="w-full h-40 sm:h-48 rounded-t" />
          
          {/* Content skeleton */}
          <div className="p-3 sm:p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            
            {/* Flavor tags skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            
            {/* Rating skeleton */}
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Row skeleton with multiple cards
const RowSkeleton = () => (
  <div className="w-full">
    <Skeleton className="h-8 w-48 mb-6" /> {/* Title skeleton */}
    <div className="flex gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

interface CollectionSectionProps {
  initialData: {
    trendingCigars: Cigar[];
    topRatedCigars: Cigar[];
  };
}

const CollectionSection = ({ initialData }: CollectionSectionProps) => {
  const [loadingStatus, setLoadingStatus] = React.useState({
    topCigarsInitial: false,  // Changed because we have initial data
    topCigarsRemaining: false,
    topBrandsInitial: true,
    topBrandsRemaining: false,
    trendingCigarsInitial: false,  // Changed because we have initial data
    trendingCigarsRemaining: false,
    trendingBrandsInitial: true,
    trendingBrandsRemaining: false
  });

  // Top Rated Cigars Queries
  const { data: initialTopCigars } = useQuery({
    queryKey: ['topCigars', 'initial'],
    queryFn: async () => initialData.topRatedCigars,
    initialData: initialData.topRatedCigars
  });
  
  React.useEffect(() => {
    if (initialTopCigars) {
      setLoadingStatus(prev => ({
        ...prev,
        topCigarsInitial: false,
        topCigarsRemaining: true
      }));
    }
  }, [initialTopCigars]);

  const { data: remainingTopCigars } = useQuery({
    queryKey: ['topCigars', 'remaining'],
    queryFn: async () => {
      const response = await fetch('/api/cigars/top-rated?limit=6&skip=4');
      if (!response.ok) throw new Error('Failed to fetch remaining top cigars');
      return response.json();
    },
    enabled: !!initialData.topRatedCigars // Changed condition to use initialData
  });
  
  React.useEffect(() => {
    if (remainingTopCigars) {
      setLoadingStatus(prev => ({
        ...prev,
        topCigarsRemaining: false
      }));
    }
  }, [remainingTopCigars]);

  // Top Rated Brands Queries
  const { data: initialTopBrands } = useQuery({
    queryKey: ['topBrands', 'initial'],
    queryFn: async () => {
      const response = await fetch('/api/brands/top-rated?limit=4');
      if (!response.ok) throw new Error('Failed to fetch initial top brands');
      return response.json();
    }
  });
  
  React.useEffect(() => {
    if (initialTopBrands) {
      setLoadingStatus(prev => ({
        ...prev,
        topBrandsInitial: false,
        topBrandsRemaining: true
      }));
    }
  }, [initialTopBrands]);

  const { data: remainingTopBrands } = useQuery({
    queryKey: ['topBrands', 'remaining'],
    queryFn: async () => {
      const response = await fetch('/api/brands/top-rated?limit=6&skip=4');
      if (!response.ok) throw new Error('Failed to fetch remaining top brands');
      return response.json();
    },
    enabled: !!initialTopBrands
  });
  
  React.useEffect(() => {
    if (remainingTopBrands) {
      setLoadingStatus(prev => ({
        ...prev,
        topBrandsRemaining: false
      }));
    }
  }, [remainingTopBrands]);

  // Trending Cigars Queries
  const { data: initialTrendingCigars } = useQuery({
    queryKey: ['trendingCigars', 'initial'],
    queryFn: async () => initialData.trendingCigars,
    initialData: initialData.trendingCigars
  });
  
  React.useEffect(() => {
    if (initialTrendingCigars) {
      setLoadingStatus(prev => ({
        ...prev,
        trendingCigarsInitial: false,
        trendingCigarsRemaining: true
      }));
    }
  }, [initialTrendingCigars]);

  const { data: remainingTrendingCigars } = useQuery({
    queryKey: ['trendingCigars', 'remaining'],
    queryFn: async () => {
      const response = await fetch('/api/cigars/trending?limit=6&skip=4');
      if (!response.ok) throw new Error('Failed to fetch remaining trending cigars');
      return response.json();
    },
    enabled: !!initialData.trendingCigars // Changed condition to use initialData
  });
  
  React.useEffect(() => {
    if (remainingTrendingCigars) {
      setLoadingStatus(prev => ({
        ...prev,
        trendingCigarsRemaining: false
      }));
    }
  }, [remainingTrendingCigars]);

  // Trending Brands Queries
  const { data: initialTrendingBrands } = useQuery({
    queryKey: ['trendingBrands', 'initial'],
    queryFn: async () => {
      const response = await fetch('/api/brands/trending?limit=4');
      if (!response.ok) throw new Error('Failed to fetch initial trending brands');
      return response.json();
    }
  });
  
  React.useEffect(() => {
    if (initialTrendingBrands) {
      setLoadingStatus(prev => ({
        ...prev,
        trendingBrandsInitial: false,
        trendingBrandsRemaining: true
      }));
    }
  }, [initialTrendingBrands]);

  const { data: remainingTrendingBrands } = useQuery({
    queryKey: ['trendingBrands', 'remaining'],
    queryFn: async () => {
      const response = await fetch('/api/brands/trending?limit=6&skip=4');
      if (!response.ok) throw new Error('Failed to fetch remaining trending brands');
      return response.json();
    },
    enabled: !!initialTrendingBrands
  });
  
  React.useEffect(() => {
    if (remainingTrendingBrands) {
      setLoadingStatus(prev => ({
        ...prev,
        trendingBrandsRemaining: false
      }));
    }
  }, [remainingTrendingBrands]);

  // Transform cigar data for the horizontal scroll section
  const transformCigarData = (cigars: Cigar[]) => cigars.map(cigar => ({
    id: cigar.id,
    href: `/cigars/${cigar.id}`,
    title: cigar.name,
    subtitle: cigar.brand?.name || 'Unknown Brand',
    value: cigar.averageRating,
    image_path: cigar.image_path,
    numberOfRatings: cigar.numberOfRatings,
    flavors: cigar.flavors,
    price_range: cigar.price_range
  }));

  // Transform brand data for the horizontal scroll section
  const transformBrandData = (brands: Brand[]) => brands.map(brand => ({
    id: brand.id,
    href: `/brands/${brand.id}`,
    title: brand.name,
    subtitle: `${brand.cigarCount} cigars`,
    value: brand.avgRating,
    image_path: brand.image_path,
    cigarCount: brand.cigarCount
  }));

  return (
    <div className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light tracking-tight text-gray-900 sm:text-4xl mb-4">
            Explore Our Collection
          </h2>
          <p className="text-lg text-gray-600">
            Discover top-rated and trending cigars curated by our community
          </p>
        </div>

        {Object.values(loadingStatus).some(status => status) ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="space-y-16">
  {/* Top Rated Cigars Section */}
  <Suspense fallback={<RowSkeleton />}>
    <HorizontalScrollSection
      title="Top Rated Cigars"
      items={transformCigarData([
        ...initialData.topRatedCigars,
        ...(remainingTopCigars || [])
      ])}
      viewAllHref="/discover?tab=top-rated-cigars"
      viewAllText="View All Top Rated"
      variant="cigar"
    />
  </Suspense>
  
  {/* Top Rated Brands Section */}
  <Suspense fallback={<RowSkeleton />}>
    {initialTopBrands && (
      <HorizontalScrollSection
        title="Top Rated Brands"
        items={transformBrandData([
          ...initialTopBrands,
          ...(remainingTopBrands || [])
        ])}
        viewAllHref="/discover?tab=top-rated-brands"
        viewAllText="View All Top Brands"
        variant="brand"
      />
    )}
  </Suspense>

  {/* Trending Cigars Section */}
  <Suspense fallback={<RowSkeleton />}>
    <HorizontalScrollSection
      title="Trending Cigars"
      items={transformCigarData([
        ...initialData.trendingCigars,
        ...(remainingTrendingCigars || [])
      ])}
      viewAllHref="/discover?tab=trending-cigars"
      viewAllText="View All Trending"
      variant="cigar"
    />
  </Suspense>

  {/* Trending Brands Section */}
  <Suspense fallback={<RowSkeleton />}>
    {initialTrendingBrands && (
      <HorizontalScrollSection
        title="Trending Brands"
        items={transformBrandData([
          ...initialTrendingBrands,
          ...(remainingTrendingBrands || [])
        ])}
        viewAllHref="/discover?tab=trending-brands"
        viewAllText="View All Trending Brands"
        variant="brand"
      />
    )}
  </Suspense>
</div>
        )}
      </div>
    </div>
  );
};

const CollectionSectionLoading = () => {
  return (
    <div className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header Skeleton */}
        <div className="text-center mb-16">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-10 w-64 sm:w-96" />
            <Skeleton className="h-6 w-96 max-w-full" />
          </div>
        </div>

        <div className="space-y-16">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="w-full">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="flex gap-4 sm:gap-6 overflow-hidden">
                {[1, 2, 3, 4].map((cardIndex) => (
                  <div key={cardIndex} className="shrink-0 w-[280px] sm:w-80">
                    <Card className="h-full">
                      <CardContent className="p-0">
                        <div className="relative">
                          <Skeleton className="w-full h-40 sm:h-48 rounded-t" />
                          <div className="p-3 sm:p-4 space-y-3">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-24" />
                              <div className="flex gap-1.5">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { CollectionSectionLoading };
export default CollectionSection;