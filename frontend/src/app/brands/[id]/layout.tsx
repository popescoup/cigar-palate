// app/brands/[id]/layout.tsx
import { Metadata } from 'next';

type Props = {
  params: {
    id: string;
  };
  children: React.ReactNode; // Add children to Props type
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const brand = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands/${params.id}`).then(res => res.json());
    
    // Get associated cigars count
    const cigarsData = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands/${params.id}/cigars?page=1&limit=1`).then(res => res.json());
    
    // Construct rich title
    const title = `${brand.name} Cigars - History, Reviews & Collection`;
    
    // Build detailed description
    const cigarCount = cigarsData.totalCigars;
    const locationText = brand.country ? `from ${brand.country}` : '';
    const yearText = brand.established ? `since ${brand.established}` : '';
    const collectionText = cigarCount 
      ? `Explore our collection of ${cigarCount} ${brand.name} cigars` 
      : `Explore ${brand.name} cigars`;
    
    const description = `
      Discover ${brand.name}, a premium cigar manufacturer ${locationText} ${yearText}. 
      ${collectionText}. Find detailed cigar reviews, ratings, and brand history on our 
      community-driven platform.
    `.replace(/\s+/g, ' ').trim();

    // Construct canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/brands/${params.id}`;
    
    // Build keywords
    const keywords = [
      brand.name,
      brand.country,
      'cigars',
      'brand',
      'manufacturer',
      'reviews',
      'collection'
    ].filter(Boolean).join(', ');

    // Base metadata object
    const metadata: Metadata = {
      title,
      description,
      keywords,
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
      },
      other: {
        'og:type': 'business.business'
      }
    };

    // Only add image metadata if an image exists
    if (brand.logo_path) {
      const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${brand.logo_path}`;
      metadata.openGraph = {
        ...metadata.openGraph,
        images: [{
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${brand.name} logo`
        }]
      };

      metadata.twitter = {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl]
      };
    }

    return metadata;

  } catch (error) {
    // Log the error
    console.error('Error generating brand metadata:', {
      brandId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Enhanced fallback metadata
    return {
      title: 'Cigar Brand Details - Premium Cigar Manufacturers',
      description: 'Explore premium cigar brands and their collections. Find detailed brand histories, cigar reviews, and ratings from our community of enthusiasts.',
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/brands/${params.id}`,
      }
    };
  }
}

// Add the layout component
export default function BrandLayout({ children }: Props) {
  return children;
}