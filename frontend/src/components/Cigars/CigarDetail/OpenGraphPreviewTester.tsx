import React from 'react';
import type { Cigar } from '@/types/cigars';

interface PreviewTesterProps {
  cigar: Cigar;
}

const OpenGraphPreviewTester: React.FC<PreviewTesterProps> = ({ cigar }) => {
  const standardImageUrl = cigar.image_key 
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${cigar.image_key}`
  : '/placeholder-cigar.jpg';
    
  // Add timestamp to prevent caching
  const timestamp = new Date().getTime();
  const newOgImageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cigars/${cigar.id}/og-image?t=${timestamp}`;
  
  const title = `${cigar.name} by ${cigar.brand?.name || 'Unknown Brand'}`;
  const description = `Explore ${cigar.name} and discover your next favorite cigar on our community-driven platform. Join us to rate, review, save, and share your cigar experiences.`;
  const url = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <div className="space-y-12">
        {/* Standard Preview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Standard Preview Card</h2>
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="bg-white">
              <div className="h-64 bg-gray-100 relative">
                <img
                  src={standardImageUrl}
                  alt={cigar.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <div className="text-gray-500 text-sm mb-2">{url}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* New OG Preview with force reload button */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">New OpenGraph Preview Card</h2>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
            >
              Force Reload Preview
            </button>
          </div>
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="bg-white">
              <div className="relative">
                <img
                  src={newOgImageUrl}
                  alt={title}
                  className="w-full"
                  // Force reload on error
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = `${newOgImageUrl}&retry=${new Date().getTime()}`;
                  }}
                />
              </div>
              <div className="p-4">
                <div className="text-gray-500 text-sm mb-2">{url}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Tags */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Current Open Graph Meta Tags:</h3>
          <pre className="bg-white p-4 rounded overflow-x-auto text-sm">
            {`<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${newOgImageUrl}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${newOgImageUrl}" />`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default OpenGraphPreviewTester;