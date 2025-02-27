// app/forum/layout.tsx
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Fetch forum stats for rich metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/threads?page=1&limit=1`);
    const data = await response.json();
    const totalThreads = data.totalThreads;

    const title = 'Cigar Discussion Forum - Community Discussions & Reviews';
    const description = `
      Join our active community of ${totalThreads || 'cigar enthusiasts'}. 
      Discuss cigars, share reviews, get recommendations, and connect with fellow aficionados. 
      Engage in conversations about flavors, brands, and collecting experiences.
    `.replace(/\s+/g, ' ').trim();

    // Construct canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/forum`;

    // Build keywords
    const keywords = [
      'cigar forum',
      'cigar discussion',
      'cigar community',
      'cigar reviews',
      'cigar recommendations',
      'cigar enthusiasts',
      'tobacco discussion',
      'cigar collecting'
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
    console.error('Error generating forum metadata:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Fallback metadata
    return {
      title: 'Cigar Discussion Forum',
      description: 'Join our community of cigar enthusiasts. Share experiences, get recommendations, and discuss everything about cigars.',
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/forum`,
      }
    };
  }
}

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}