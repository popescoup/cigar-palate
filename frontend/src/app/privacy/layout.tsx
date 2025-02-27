// app/privacy/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Privacy Policy | ${process.env.NEXT_PUBLIC_SITE_NAME}`,
  description: 'Learn about how we collect, use, and protect your personal information. Our privacy policy details our commitment to data security and user privacy in the cigar community.',
  openGraph: {
    title: 'Privacy Policy',
    description: 'Detailed information about our data collection practices, user privacy rights, and commitment to protecting your personal information.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/privacy`,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  }
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}