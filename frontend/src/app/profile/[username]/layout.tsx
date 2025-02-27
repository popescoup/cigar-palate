// app/profile/[username]/layout.tsx
import { Metadata } from 'next';

type Props = {
  params: {
    username: string;
  };
  children: React.ReactNode; // Add children to Props type
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Fetch the user profile data
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/${params.username}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await response.json();

    // Create rich description using bio if available
    const description = profile.bio 
      ? `${profile.bio.slice(0, 150)}${profile.bio.length > 150 ? '...' : ''}`
      : `Explore ${profile.username}'s cigar reviews, forum contributions, and collection. Join the discussion and connect with fellow enthusiasts.`;

    // Add stats to enrich metadata if available
    const stats = profile.reputation
      ? `Member with ${profile.reputation} reputation points. `
      : '';

    // Construct canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/profile/${params.username}`;

    return {
      title: `${profile.username}'s Profile | ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      description: stats + description,
      alternates: {
        canonical,
      },
      openGraph: {
        title: `${profile.username}'s Cigar Profile`,
        description: stats + description,
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
    console.error('Error generating user profile metadata:', {
      username: params.username,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Fallback metadata
    return {
      title: `User Profile | ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      description: 'View member profile and contributions in our cigar community.',
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

// Add the layout component
export default function UserProfileLayout({ children }: Props) {
  return children;
}