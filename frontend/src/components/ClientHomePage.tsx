'use client';

import { Suspense } from 'react';
import CollectionSection, { CollectionSectionLoading } from '@/components/sections/CollectionSection';
import type { Cigar } from '@/types/cigars';
import type { Brand } from '@/types/collection';

interface ClientHomePageProps {
  initialData: {
    trendingCigars: Cigar[];
    topRatedCigars: Cigar[];
    topRatedBrands: Brand[];
    trendingBrands: Brand[];
  }
}

export default function ClientHomePage({ initialData }: ClientHomePageProps) {
  return (
    <Suspense fallback={<CollectionSectionLoading />}>
      <CollectionSection initialData={initialData} />
    </Suspense>
  );
}