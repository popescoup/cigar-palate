// app/brands/page.tsx
import dynamic from 'next/dynamic';

// Dynamically import BrandsList with no SSR since it's client-only
const BrandsList = dynamic(
  () => import('@/components/Brands/BrandsList'),
  { ssr: false }
);

export default function BrandsPage() {
  return (
    <div className="brands-layout">
      <BrandsList />
    </div>
  );
}