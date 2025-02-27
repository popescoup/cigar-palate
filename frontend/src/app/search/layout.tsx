// app/search/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Cigars & Community | CigarPalate',
  description: 'Search our collection of cigars, brands, and community discussions. Find detailed information and reviews from fellow enthusiasts.',
  openGraph: {
    title: 'Search Cigars & Community',
    description: 'Search our collection of cigars, brands, and community discussions.',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  }
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}