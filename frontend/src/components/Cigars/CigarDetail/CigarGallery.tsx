import React, { useState } from 'react';
import Image from 'next/image';
import type { Cigar } from '@/types/cigars';
import { getImageUrl } from '@/utils/imageUtils';

interface CigarGalleryProps {
  cigar: Cigar;
}

const CigarGallery: React.FC<CigarGalleryProps> = ({ cigar }) => {
  // Use the image_key directly with no fallback
  const [imgSrc, setImgSrc] = useState<string | null>(getImageUrl(cigar.image_key) || '');
  const [isError, setIsError] = useState(false);

  if (!cigar.image_key) {
    return null;
  }

  return (
    <section className="w-full py-6 sm:py-12 -ml-2 sm:-ml-4">
      <div className="relative w-full">
        <Image 
          src={imgSrc || '/placeholder-cigar.jpg'}
          alt={cigar.name}
          width={1200}
          height={900}
          className="w-full max-h-[400px] sm:max-h-[600px] object-contain"
          priority
          onError={() => {
            if (!isError) {
              setImgSrc('/placeholder-cigar.jpg');
              setIsError(true);
            }
          }}
        />
      </div>
    </section>
  );
};

export default CigarGallery;