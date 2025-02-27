import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Fetch total count of cigars for more specific metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cigars?page=1&limit=1`);
    const data = await response.json();
    const totalCigars = data.totalCigars;

    // Construct title and description
    const title = 'Premium Cigars Collection - Reviews, Ratings & Recommendations';
    const description = `
      Explore our curated collection of ${totalCigars || 'premium'} cigars. 
      Find detailed reviews, ratings, and recommendations from our community. 
      Browse by brand, strength, origin, or size to discover your next favorite cigar.
    `.replace(/\s+/g, ' ').trim();

    // Construct canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/cigars`;

    // Build keywords
    const keywords = [
      'cigars',
      'premium cigars',
      'cigar reviews',
      'cigar ratings',
      'cigar collection',
      'cigar recommendations',
      'buy cigars',
      'cigar brands'
    ].join(', ');

    return {
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
        'og:type': 'website',
      }
    };

  } catch (error) {
    // Log the error
    console.error('Error generating cigars list metadata:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Fallback metadata
    return {
      title: 'Premium Cigars Collection',
      description: 'Explore our extensive collection of premium cigars. Find detailed reviews, ratings, and recommendations from our community of cigar enthusiasts.',
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/cigars`,
      }
    };
  }
}

export default function CigarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}