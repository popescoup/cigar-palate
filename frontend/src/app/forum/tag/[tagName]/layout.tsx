// app/forum/tag/[tagName]/layout.tsx
import { Metadata } from 'next';
import { Thread } from '@/types/forum';

type Props = {
  params: {
    tagName: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Decode the tag name for the API request
    const decodedTagName = decodeURIComponent(params.tagName);
    
    // Fetch threads for this tag
    const threads: Thread[] = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tags/${encodeURIComponent(decodedTagName)}/threads`
    ).then(res => res.json());

    // Create tag-specific title
    const title = `${decodedTagName} Discussions - Cigar Forum`;

    // Create rich description
    const description = `
      Explore ${threads.length} discussion${threads.length !== 1 ? 's' : ''} about ${decodedTagName} in our cigar community. 
      Join conversations, share experiences, and connect with other cigar enthusiasts interested in ${decodedTagName}.
    `.replace(/\s+/g, ' ').trim();

    // Construct canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/forum/tag/${encodeURIComponent(decodedTagName)}`;

    // Build keywords
    const keywords = [
      decodedTagName,
      'cigar discussion',
      'cigar forum',
      'cigar community',
      'cigar topics',
      `${decodedTagName} cigars`,
      'cigar reviews',
      'cigar recommendations'
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
      }
    };

  } catch (error) {
    // Log the error
    console.error('Error generating tag page metadata:', {
      tagName: params.tagName,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Fallback metadata
    const decodedTagName = decodeURIComponent(params.tagName);
    return {
      title: `${decodedTagName} - Cigar Discussions`,
      description: `Explore discussions tagged with ${decodedTagName} in our cigar community. Share experiences and connect with fellow enthusiasts.`,
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/forum/tag/${encodeURIComponent(decodedTagName)}`,
      }
    };
  }
}

export default function TagLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}