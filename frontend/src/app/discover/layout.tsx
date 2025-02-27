// app/discover/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Premium Cigars | CigarPalate',
  description: 'Explore our curated collection of premium cigars and brands. Find top-rated cigars, trending manufacturers, and personalized recommendations.',
  openGraph: {
    title: 'Discover Premium Cigars',
    description: 'Explore our curated collection of premium cigars and brands.',
    type: 'website',
  },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}