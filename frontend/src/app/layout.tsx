// src/app/layout.tsx
import { Metadata, Viewport } from 'next';
import { Providers } from '@/providers/Providers';
import ClientLayout from './ClientLayout';
import NavigationProgress from '@/components/navigation/NavigationProgress';
import { RootSuspense } from '@/components/RootSuspense';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME || 'CigarPalate.com',
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || 'CigarPalate.com'}`
  },
  description: 'Discover and share your passion for premium cigars. Join our community of enthusiasts to explore reviews, ratings, and discussions about the finest cigars.',
  keywords: [
    'cigars',
    'premium cigars',
    'cigar reviews',
    'cigar ratings',
    'cigar community',
    'cigar enthusiasts',
    'cigar palate',
    'cigarpalate.com'
  ],
  openGraph: {
    type: 'website',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'CigarPalate.com',
    title: process.env.NEXT_PUBLIC_SITE_NAME || 'CigarPalate.com',
    description: 'Discover and share your passion for premium cigars. Join our thriving community of cigar enthusiasts.',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL,
  },
  manifest: '/site.webmanifest', // Update from manifest.json to site.webmanifest
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white text-gray-900 flex flex-col">
        <RootSuspense>
          <Providers>
            <NavigationProgress />
            <ClientLayout>{children}</ClientLayout>
          </Providers>
        </RootSuspense>
      </body>
    </html>
  );
}