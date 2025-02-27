// app/terms/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Terms of Service | ${process.env.NEXT_PUBLIC_SITE_NAME}`,
  description: 'Review our terms of service including age requirements, account policies, content usage rights, and community guidelines for our cigar enthusiast platform.',
  openGraph: {
    title: 'Terms of Service',
    description: 'Understanding our platform rules, user responsibilities, and legal terms for participating in our cigar community.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/terms`,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/terms`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  }
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}