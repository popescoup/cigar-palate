import React from 'react';
import type { Cigar } from '@/types/cigars';
import HorizontalScrollSection from '@/components/sections/horizontal-scroll-section';

interface CigarBarsProps {
  similarCigars: Cigar[];
  brandCigars: Cigar[];
  brandName?: string;
}

const CigarBars: React.FC<CigarBarsProps> = ({
  similarCigars,
  brandCigars,
  brandName = 'this brand'
}) => {
  // Only render div if at least one section has cigars
  if (similarCigars.length === 0 && brandCigars.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Similar Cigars Section */}
      {similarCigars.length > 0 && (
        <>
          <HorizontalScrollSection
            title="Similar Cigars"
            items={similarCigars.map(cigar => ({
              id: cigar.id,
              href: `/cigars/${cigar.id}`,
              title: cigar.name,
              subtitle: cigar.brand?.name || 'Unknown Brand',
              value: cigar.averageRating,
              image_path: cigar.image_path,
              numberOfRatings: cigar.numberOfRatings,
              flavors: cigar.flavors,
              price_range: cigar.price_range
            }))}
            variant="cigar"
          />
          {/* Only show divider if both sections are present */}
          {brandCigars.length > 0 && (
            <div className="border-t border-gray-200" />
          )}
        </>
      )}

      {/* Brand Cigars Section */}
      {brandCigars.length > 0 && (
        <HorizontalScrollSection
          title={`More from ${brandName}`}
          items={brandCigars.map(cigar => ({
            id: cigar.id,
            href: `/cigars/${cigar.id}`,
            title: cigar.name,
            subtitle: cigar.brand?.name || 'Unknown Brand',
            value: cigar.averageRating,
            image_path: cigar.image_path,
            numberOfRatings: cigar.numberOfRatings,
            flavors: cigar.flavors,
            price_range: cigar.price_range
          }))}
          variant="cigar"
        />
      )}
    </div>
  );
};

export default CigarBars;