// app/about/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { ComponentType } from 'react';

const ClientPageTemplate = dynamic(
  () =>
    import('@/components/PageTemplate').then(
      (mod) => ({ default: mod.PageTemplate })
    ) as Promise<{ default: ComponentType<{ children: React.ReactNode }> }>,
  { ssr: false }
);

function AboutContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            About CigarPalate.com
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Your trusted companion in the world of premium cigars
          </p>
        </div>

        {/* Our Mission */}
        <div className="prose prose-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
          <p>
            CigarPalate.com was founded with a singular purpose: to create a comprehensive and engaging platform for cigar enthusiasts to discover, learn about, and share their passion for premium cigars. We strive to be the most reliable source of cigar information and community engagement in the digital space.
          </p>

          {/* What We Offer */}
          <h2 className="text-2xl font-bold text-gray-900 mt-8">What We Offer</h2>
          <p>
            Our platform provides detailed information about cigars from around the world, including comprehensive reviews, ratings, and detailed profiles of different brands and their offerings. We maintain a dedicated community forum where enthusiasts can share their experiences, ask questions, and connect with fellow aficionados.
          </p>

          {/* How Our Platform Works */}
          <h2 className="text-2xl font-bold text-gray-900 mt-8">How Our Platform Works</h2>
          <p>
            At the heart of CigarPalate.com lies our community-driven database, a living repository of cigar knowledge built entirely through the contributions of passionate enthusiasts like you. Every cigar and brand profile in our database is submitted by community members, ensuring our content remains current, diverse, and authentic to the real experiences of cigar enthusiasts.
          </p>
          <p>
            To maintain the highest standards of quality and accuracy, all submissions undergo a thorough review process by our dedicated team of administrators. Each entry is evaluated based on three key criteria: completeness of information, accuracy of data, and quality of accompanying images. This careful screening process ensures that our database remains a reliable resource for the entire community.
          </p>
          <p>
            We believe in recognizing and rewarding our contributors. When a submission is approved, the contributing member receives a boost to their numerical reputation score, reflecting their valuable addition to our collective knowledge base. This system not only helps identify active and reliable contributors but also encourages the sharing of high-quality, detailed information that benefits all members of our community.
          </p>

          {/* Community Values */}
          <h2 className="text-2xl font-bold text-gray-900 mt-8">Community Values</h2>
          <p>
            We believe in fostering an inclusive, respectful, and knowledgeable community. Whether you're new to cigars or a seasoned enthusiast, you'll find valuable information and engaging discussions here. We encourage the responsible enjoyment of premium cigars and maintain high standards for the quality of information shared on our platform.
          </p>

          {/* Our Commitment to Transparency */}
          <h2 className="text-2xl font-bold text-gray-900 mt-8">Our Commitment to Transparency</h2>
          <p>
            We are committed to providing unbiased, accurate information. While we may earn commissions through affiliate partnerships, this never influences our reviews or recommendations. Our primary goal is to serve the cigar community with integrity and transparency.
          </p>

          {/* Get in Touch */}
          <h2 className="text-2xl font-bold text-gray-900 mt-8">Get in Touch</h2>
          <p>
            Have questions or need assistance? Our dedicated support team is here to help. Reach out to us at{' '}
            <a
              href="mailto:support@cigarpalate.com"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              support@cigarpalate.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPageTemplate>
        <AboutContent />
      </ClientPageTemplate>
    </Suspense>
  );
}