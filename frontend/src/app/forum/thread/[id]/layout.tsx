// app/forum/thread/[id]/layout.tsx
import { Metadata } from 'next';
import { Thread, Tag } from '@/types/forum';

type Props = {
  params: {
    id: string;
  };
  children: React.ReactNode; // Add children prop
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const thread: Thread = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/threads/${params.id}`
    ).then(res => res.json());

    // Create discussion title
    const title = `${thread.title} - Cigar Discussion`;

    // Create rich description from thread content
    const contentPreview = thread.content
      .slice(0, 150)
      .replace(/\s+/g, ' ')
      .trim();
    
    const description = `
      ${contentPreview}... Join the discussion with ${thread.reply_count || '0'} replies. 
      Started by ${thread.user.username}. Share your thoughts and experiences about this cigar topic.
    `.replace(/\s+/g, ' ').trim();

    // Construct canonical URL
    const canonical = `${process.env.NEXT_PUBLIC_SITE_URL}/forum/thread/${params.id}`;

    // Build keywords including thread tags
    const keywords = [
      'cigar discussion',
      'cigar forum',
      thread.title,
      ...(thread.tags?.map((tag: Tag) => tag.name) || []),
      'cigar community'
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
        type: 'article',
        locale: 'en_US',
        publishedTime: thread.created_at,
        modifiedTime: thread.updated_at,
        authors: [thread.user.username],
        tags: thread.tags?.map((tag: Tag) => tag.name),
      }
    };

    // Add image metadata if thread has an image
    if (thread.image_path) {
      const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${thread.image_path}`;
      metadata.openGraph = {
        ...metadata.openGraph,
        images: [{
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: thread.title
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
    console.error('Error generating thread metadata:', {
      threadId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Fallback metadata
    return {
      title: 'Cigar Discussion Thread',
      description: 'Join the conversation in our cigar enthusiast community. Share your thoughts and experiences.',
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/forum/thread/${params.id}`,
      }
    };
  }
}

// Add the layout component
export default function ThreadLayout({ children }: Props) {
  return children;
}