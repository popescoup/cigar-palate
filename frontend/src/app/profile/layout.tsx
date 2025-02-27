// app/profile/layout.tsx
import { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Fetch the current user's profile
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/profile`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const profile = await response.json();
    
    // Create descriptive title and description
    const title = `${profile.username}'s Profile`;
    const description = profile.bio 
      ? `${profile.bio.slice(0, 150)}${profile.bio.length > 150 ? '...' : ''}`
      : `View ${profile.username}'s contributions, reviews, and activity. Join our community of cigar enthusiasts.`;

    // Construct canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/profile`;

    return {
      title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: process.env.NEXT_PUBLIC_SITE_NAME,
        type: 'profile',
        locale: 'en_US',
        username: profile.username,
      },
      robots: {
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      }
    };

  } catch (error) {
    console.error('Error generating profile metadata:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return {
      title: 'My Profile',
      description: 'View your cigar collection, reviews, and community contributions.',
      robots: {
        index: false,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      }
    };
  }
}

// Add the layout component export
export default function ProfileLayout({ children }: Props) {
  return children;
}