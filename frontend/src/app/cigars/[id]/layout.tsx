// app/cigars/[id]/layout.tsx
import { Metadata } from 'next';

type Props = {
  params: {
    id: string;
  };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const cigar = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cigars/${params.id}`).then(res => res.json());
    
    // Construct a richer title
    const title = `${cigar.name} by ${cigar.brand?.name || 'Unknown Brand'} - Cigar Reviews & Ratings`;
    
    // Build a more detailed description
    const strengthText = cigar.strength ? `${cigar.strength} bodied` : '';
    const sizeText = cigar.size ? cigar.size : '';
    const ratingText = cigar.averageRating 
      ? `Rated ${cigar.averageRating.toFixed(1)}/5 by our community` 
      : 'Discover community ratings';
    const originText = cigar.origin ? `from ${cigar.origin}` : '';
    
    const description = `
      Experience the ${cigar.name}, a ${strengthText} ${sizeText} cigar ${originText}. 
      ${ratingText}. Explore detailed reviews, flavor profiles, and cigar characteristics 
      on our community-driven platform.
    `.replace(/\s+/g, ' ').trim();

    // Construct the canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/cigars/${params.id}`;
    
    // Build keywords from cigar attributes
    const keywords = [
      cigar.name,
      cigar.brand?.name,
      cigar.strength,
      cigar.size,
      cigar.origin,
      'cigar',
      'review',
      'rating'
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
        'og:type': 'product',
        'og:product:price:amount': cigar.price?.toString() || '',
        'og:product:price:currency': 'USD',
      }
    };

    // Only add image metadata if an image exists
    if (cigar.image_key) {
      const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${cigar.image_key}`;
      metadata.openGraph = {
        ...metadata.openGraph,
        images: [{
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${cigar.name} cigar`
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
    console.error('Error generating cigar metadata:', {
      cigarId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Enhanced fallback metadata
    return {
      title: 'Cigar Details - Premium Cigar Reviews & Ratings',
      description: 'Explore our extensive collection of premium cigars. Find detailed reviews, ratings, and flavor profiles from our community of cigar enthusiasts.',
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/cigars/${params.id}`,
      }
    };
  }
}

export default function CigarLayout({ children }: Props) {
  return children;
}