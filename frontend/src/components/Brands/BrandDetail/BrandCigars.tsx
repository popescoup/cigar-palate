// components/Brands/BrandDetail/BrandCigars.tsx
'use client';

import React from 'react';
import CigarCard from '@/components/Cigars/CigarsList/CigarCard';
import { InfiniteScrollTrigger } from '@/components/InfiniteScrollTrigger';
import { Cigar } from '@/types/cigars';

interface BrandCigarsProps {
  cigars: Cigar[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

const BrandCigars: React.FC<BrandCigarsProps> = ({ 
  cigars, 
  hasMore, 
  isLoading, 
  onLoadMore 
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Cigars in this Brand</h2>
      
      {cigars.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cigars.map(cigar => (
              <CigarCard key={cigar.id} cigar={cigar} />
            ))}
          </div>
          <InfiniteScrollTrigger
            onIntersect={onLoadMore}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        </>
      ) : (
        <p className="text-base sm:text-lg text-gray-500">
          No cigars available for this brand
        </p>
      )}
    </div>
  );
};

export default BrandCigars;