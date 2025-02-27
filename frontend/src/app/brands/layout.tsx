// app/brands/layout.tsx
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Fetch total count of brands for more specific metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands?page=1&limit=1`);
    const data = await response.json();
    const totalBrands = data.totalBrands;

    // Rest of your metadata generation...
    const title = 'Cigar Brands Directory - Premium Manufacturers & Heritage';
    const description = `
      Explore ${totalBrands || 'our comprehensive collection of'} premium cigar brands. 
      Discover legendary manufacturers, their histories, and complete cigar collections. 
      Browse alphabetically or search by region to find iconic and boutique cigar makers.
    `.replace(/\s+/g, ' ').trim();

    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/brands`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: process.env.NEXT_PUBLIC_SITE_NAME,
        type: 'website',
        locale: 'en_US',
      }
    };

  } catch (error) {
    console.error('Error generating brands list metadata:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return {
      title: 'Cigar Brands Directory',
      description: 'Explore our comprehensive directory of premium cigar brands and manufacturers.',
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/brands`,
      }
    };
  }
}

// Keep this as a server component (no 'use client' directive)
export default function BrandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}