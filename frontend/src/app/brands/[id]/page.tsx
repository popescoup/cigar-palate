// app/brands/[id]/page.tsx
import { Suspense } from 'react';
import BrandDetail from '@/components/Brands/BrandDetail';

interface BrandDetailPageProps {
  params: {
    id: string;
  };
}

export default function BrandDetailPage({ params }: BrandDetailPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandDetail brandId={parseInt(params.id)} />
    </Suspense>
  );
}