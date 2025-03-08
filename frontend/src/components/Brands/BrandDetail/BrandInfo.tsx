import React from 'react';
import Image from 'next/image';
import { Brand } from '../types';
import { getImageUrl } from '@/utils/imageUtils';

interface BrandInfoProps {
  brand: Brand;
}

const BrandInfo: React.FC<BrandInfoProps> = ({ brand }) => {
  // Get the image source from either image_url or by generating it from image_key
  const imageSrc = brand.image_url || (brand.image_key ? getImageUrl(brand.image_key) : null);

  return (
    <div className="mb-6 sm:mb-8 max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
        {brand.name}
      </h1>
      
      <div className="mb-4 sm:mb-6 relative w-full max-w-2xl h-40 sm:h-48 md:h-[500px]">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`${brand.name} logo`}
          fill
          className="object-contain object-left"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
          <span className="text-base sm:text-lg text-gray-400">No image available</span>
        </div>
      )}
      </div>

      <div>
        {brand.description ? (
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            {brand.description}
          </p>
        ) : (
          <p className="text-base sm:text-lg text-gray-400 italic">
            No description available for this brand.
          </p>
        )}
      </div>
    </div>
  );
};

export default BrandInfo;