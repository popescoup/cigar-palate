import React, { useState } from 'react';
import Image from 'next/image';
import type { Cigar } from '@/types/cigars';

interface CigarGalleryProps {
  cigar: Cigar;
}

const CigarGallery: React.FC<CigarGalleryProps> = ({ cigar }) => {
  const [imgSrc, setImgSrc] = useState(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${cigar.image_path}`);
  const [isError, setIsError] = useState(false);

  if (!cigar.image_path) {
    return null;
  }

  return (
    <section className="w-full py-6 sm:py-12 -ml-2 sm:-ml-4">
      <div className="relative w-full">
        <Image 
          src={imgSrc}
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