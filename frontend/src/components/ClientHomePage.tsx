'use client';

import { Suspense } from 'react';
import CollectionSection, { CollectionSectionLoading } from '@/components/sections/CollectionSection';
import type { Cigar } from '@/types/cigars';

interface ClientHomePageProps {
  initialData: {
    trendingCigars: Cigar[];
    topRatedCigars: Cigar[];
  }
}

export default function ClientHomePage({ initialData }: ClientHomePageProps) {
  return (
    <Suspense fallback={<CollectionSectionLoading />}>
      <CollectionSection initialData={initialData} />
    </Suspense>
  );
}