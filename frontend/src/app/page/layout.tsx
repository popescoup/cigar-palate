// app/page/layout.tsx
import { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Fetch some dynamic data for the metadata
    const [topCigarsRes, topBrandsRes, threadsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cigars/top-rated?limit=1`),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands/top-rated?limit=1`),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/threads/trending?limit=1`)
    ]);

    const [cigarsData, brandsData, threadsData] = await Promise.all([
      topCigarsRes.json(),
      topBrandsRes.json(),
      threadsRes.json()
    ]);

    // Create rich metadata using the dynamic data
    const description = `
      Join CigarPalate.com - your premier destination for cigar enthusiasts. 
      Explore our collection of premium cigars, connect with fellow aficionados, and discover 
      top-rated brands. Featured content includes ${cigarsData.totalCigars || 'numerous'} cigars, 
      ${brandsData.totalBrands || 'multiple'} brands, and an active community forum with 
      ${threadsData.totalThreads || 'engaging'} discussions.
    `.replace(/\s+/g, ' ').trim();

    // Build SEO-rich keywords based on your content
    const keywords = [
      'premium cigars',
      'cigar reviews',
      'cigar ratings',
      'cigar community',
      'cigar forum',
      'cigar brands',
      'cigar enthusiasts',
      'cigar palate',
      'top rated cigars',
      'trending cigars',
      'cigar discussions'
    ].join(', ');

    return {
      title: {
        absolute: process.env.NEXT_PUBLIC_SITE_NAME || 'CigarPalate.com - Premium Cigar Community'
      },
      description,
      keywords,
      openGraph: {
        type: 'website',
        title: process.env.NEXT_PUBLIC_SITE_NAME || 'CigarPalate.com',
        description,
        url: process.env.NEXT_PUBLIC_SITE_URL,
        siteName: process.env.NEXT_PUBLIC_SITE_NAME,
        locale: 'en_US',
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`, // Add your OG image
            width: 1200,
            height: 630,
            alt: 'CigarPalate.com - Premium Cigar Community'
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title: process.env.NEXT_PUBLIC_SITE_NAME,
        description,
        images: [`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`] // Same as OG image
      },
      alternates: {
        canonical: process.env.NEXT_PUBLIC_SITE_URL,
      },
      robots: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
        nocache: true
      }
    };
  } catch (error) {
    // Fallback metadata if API calls fail
    console.error('Error generating home page metadata:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Return static fallback metadata
    return {
      title: {
        absolute: process.env.NEXT_PUBLIC_SITE_NAME || 'CigarPalate.com - Premium Cigar Community'
      },
      description: 'Join the CigarPalate.com - your premier destination for cigar enthusiasts. Explore premium cigars, connect with fellow aficionados, and discover top-rated brands.',
      alternates: {
        canonical: process.env.NEXT_PUBLIC_SITE_URL,
      }
    };
  }
}

export default function HomeLayout({ children }: Props) {
  return children;
}