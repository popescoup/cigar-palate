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
   topRatedBrands: Brand[];
   trendingBrands: Brand[];
 };
}

const CollectionSection = ({ initialData }: CollectionSectionProps) => {
 // Top Rated Cigars Query - use initialData directly
 const { data: topRatedCigars } = useQuery({
   queryKey: ['topCigars'],
   queryFn: async () => initialData.topRatedCigars,
   initialData: initialData.topRatedCigars,
   enabled: !!initialData.topRatedCigars
 });

 // Top Rated Brands Query - use initialData directly
 const { data: topBrands } = useQuery({
   queryKey: ['topBrands'],
   queryFn: async () => initialData.topRatedBrands,
   initialData: initialData.topRatedBrands,
   enabled: !!initialData.topRatedBrands
 });

 // Trending Cigars Query - use initialData directly
 const { data: trendingCigars } = useQuery({
   queryKey: ['trendingCigars'],
   queryFn: async () => initialData.trendingCigars,
   initialData: initialData.trendingCigars,
   enabled: !!initialData.trendingCigars
 });

 // Trending Brands Query - use initialData directly
 const { data: trendingBrands } = useQuery({
   queryKey: ['trendingBrands'],
   queryFn: async () => initialData.trendingBrands,
   initialData: initialData.trendingBrands,
   enabled: !!initialData.trendingBrands
 });

 // Transform cigar data for the horizontal scroll section
 const transformCigarData = (cigars: Cigar[]) => cigars.map(cigar => ({
   id: cigar.id,
   href: `/cigars/${cigar.id}`,
   title: cigar.name,
   subtitle: cigar.brand?.name || 'Unknown Brand',
   value: cigar.averageRating,
   image_key: cigar.image_key,
   image_url: cigar.image_url,
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
   image_key: brand.image_key,
   image_url: brand.image_url,
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

       <div className="space-y-16">
         {/* Top Rated Cigars Section */}
         <Suspense fallback={<RowSkeleton />}>
           <HorizontalScrollSection
             title="Top Rated Cigars"
             items={transformCigarData(topRatedCigars?.slice(0, 10) || [])}
             viewAllHref="/discover?tab=top-rated-cigars"
             viewAllText="View All Top Rated"
             variant="cigar"
           />
         </Suspense>

         {/* Top Rated Brands Section */}
         <Suspense fallback={<RowSkeleton />}>
           <HorizontalScrollSection
             title="Top Rated Brands"
             items={transformBrandData(topBrands?.slice(0, 10) || [])}
             viewAllHref="/discover?tab=top-rated-brands"
             viewAllText="View All Top Brands"
             variant="brand"
           />
         </Suspense>

         {/* Trending Cigars Section */}
         <Suspense fallback={<RowSkeleton />}>
           <HorizontalScrollSection
             title="Trending Cigars"
             items={transformCigarData(trendingCigars?.slice(0, 10) || [])}
             viewAllHref="/discover?tab=trending-cigars"
             viewAllText="View All Trending"
             variant="cigar"
           />
         </Suspense>

         {/* Trending Brands Section */}
         <Suspense fallback={<RowSkeleton />}>
           <HorizontalScrollSection
             title="Trending Brands"
             items={transformBrandData(trendingBrands?.slice(0, 10) || [])}
             viewAllHref="/discover?tab=trending-brands"
             viewAllText="View All Trending Brands"
             variant="brand"
           />
         </Suspense>
       </div>
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