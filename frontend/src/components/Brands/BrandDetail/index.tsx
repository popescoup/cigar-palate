'use client';

import React from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Brand } from '../types';
import { Cigar } from '@/types/cigars';
import BrandInfo from './BrandInfo';
import BrandCigars from './BrandCigars';

interface BrandDetailProps {
  brandId: number;
}

interface CigarResponse {
  cigars: Cigar[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  totalCigars: number;
}

// Fetch brand details
const fetchBrand = async (brandId: number): Promise<Brand> => {
  const { data } = await axios.get(`/api/brands/${brandId}`);
  return data;
};

// Fetch brand cigars with pagination
const fetchBrandCigars = async ({ pageParam = 1, brandId }: { pageParam?: number, brandId: number }): Promise<CigarResponse> => {
  const { data } = await axios.get(`/api/brands/${brandId}/cigars`, {
    params: {
      page: pageParam,
      limit: 6
    }
  });

  return {
    cigars: data.cigars.map((cigar: any) => ({
      ...cigar,
      shape: cigar.shape || 'Unknown',
      size: cigar.size || 'Unknown',
      color: cigar.color || 'Unknown',
      wrap_type: cigar.wrap_type || 'Unknown',
      filler: cigar.filler || 'Unknown',
      country_of_origin: cigar.country_of_origin || 'Unknown',
      binder: cigar.binder || 'Unknown',
      strength: cigar.strength || 'Unknown',
      brand: cigar.brand || { id: 0, name: 'Unknown Brand' },
      totalRatings: cigar.totalRatings || 0,
      total_bookmarks: cigar.total_bookmarks || 0,
      averageRating: cigar.averageRating || 0,
      numberOfRatings: cigar.numberOfRatings || 0,
      flavors: Array.isArray(cigar.flavors) ? cigar.flavors : []
    })),
    currentPage: data.currentPage,
    totalPages: data.totalPages,
    hasNextPage: data.hasNextPage,
    totalCigars: data.totalCigars
  };
};

export default function BrandDetail({ brandId }: BrandDetailProps) {
  // Query for brand details
  const { 
    data: brand, 
    isLoading: isBrandLoading,
    isError: isBrandError,
    error: brandError
  } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => fetchBrand(brandId),
  });

  // Infinite query for brand cigars
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isCigarsLoading,
    isError: isCigarsError,
    error: cigarsError
  } = useInfiniteQuery({
    queryKey: ['brandCigars', brandId],
    queryFn: ({ pageParam }) => fetchBrandCigars({ brandId, pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
  });

  // Loading states
  if (isBrandLoading || isCigarsLoading) {
    return <div className="text-center py-6 sm:py-8 text-base sm:text-lg">Loading brand details...</div>;
  }

  // Error states
  if (isBrandError) {
    return <div className="text-red-500 py-6 sm:py-8 text-base sm:text-lg">
      {(brandError as Error).message || 'Failed to load brand'}
    </div>;
  }

  if (isCigarsError) {
    return <div className="text-red-500 py-6 sm:py-8 text-base sm:text-lg">
      {(cigarsError as Error).message || 'Failed to load cigars'}
    </div>;
  }

  // Not found state
  if (!brand) {
    return <div className="text-center py-6 sm:py-8 text-base sm:text-lg">Brand not found</div>;
  }

  // Flatten all pages of cigars into a single array
  const allCigars = data?.pages.flatMap(page => page.cigars) ?? [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <BrandInfo brand={brand} />
      <div className="border-b border-gray-200 my-6 sm:my-8"></div>
      <BrandCigars 
        cigars={allCigars}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  );
}