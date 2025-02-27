// app/about/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `About CigarPalate.com | ${process.env.NEXT_PUBLIC_SITE_NAME}`,
  description: 'Discover our mission to create a comprehensive platform for cigar enthusiasts. Learn about our community values, commitment to quality information, and dedication to the world of premium cigars.',
  openGraph: {
    title: 'About CigarPalate.com',
    description: 'Your trusted companion in the world of premium cigars. Learn about our mission, community values, and commitment to cigar enthusiasts.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/about`,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/about`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  }
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}