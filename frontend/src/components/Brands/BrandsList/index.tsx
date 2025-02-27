// components/Brands/BrandsList/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandCard from './BrandCard';
import Pagination from '@/components/ui/pagination';
import { AlphabeticalList } from './ListView';
import { useInfiniteBrands } from '@/hooks/useInfiniteBrands';
import { Brand, PaginationMeta } from '../types';

interface BrandsResponse {
  brands: Brand[];
  currentPage: number;
  totalPages: number;
  totalBrands: number;
}

type ViewMode = 'grid' | 'list';

// API fetching function for grid view
const fetchBrands = async (page: number): Promise<BrandsResponse> => {
  const { data } = await axios.get(`/api/brands`, {
    params: {
      page,
      limit: 21
    }
  });
  return data;
};

export default function BrandsList() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Load view preference from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('brandViewMode') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('brandViewMode', viewMode);
  }, [viewMode]);

  // Grid view query
  const { 
    data: gridData,
    isLoading: isGridLoading,
    isError: isGridError,
    error: gridError
  } = useQuery({
    queryKey: ['brands', currentPage],
    queryFn: () => fetchBrands(currentPage),
    enabled: viewMode === 'grid',
    placeholderData: (previousData) => previousData
  });

  // List view query (infinite)
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteBrands();

  const isLoading = viewMode === 'grid' ? isGridLoading : isListLoading;
  const isError = viewMode === 'grid' ? isGridError : isListError;
  const error = viewMode === 'grid' ? gridError : listError;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-500">
        {error instanceof Error ? error.message : 'Failed to load brands'}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">All Brands</h1>
        <div className="border rounded-lg p-1 flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-7 w-7 sm:h-8 sm:w-8"
            aria-label="Grid view"
          >
            <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-7 w-7 sm:h-8 sm:w-8"
            aria-label="List view"
          >
            <List className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
  
      {viewMode === 'grid' && gridData && gridData.brands.length > 0 ? (
        <>
          {/* Top Pagination */}
          {gridData.totalPages > 1 && (
            <div className="mb-4 sm:mb-6">
              <Pagination
                currentPage={gridData.currentPage}
                totalPages={gridData.totalPages}
                onPageChange={handlePageChange}
                className="text-sm sm:text-base"
              />
            </div>
          )}
  
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {gridData.brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
  
          {/* Bottom Pagination */}
          {gridData.totalPages > 1 && (
            <div className="mt-4 sm:mt-6">
              <Pagination
                currentPage={gridData.currentPage}
                totalPages={gridData.totalPages}
                onPageChange={handlePageChange}
                className="text-sm sm:text-base"
              />
            </div>
          )}
        </>
      ) : viewMode === 'list' && listData ? (
        <AlphabeticalList
          pages={listData.pages}
          hasNextPage={hasNextPage ?? false}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      ) : (
        <div className="text-center py-6 sm:py-8 text-gray-500">
          No brands available
        </div>
      )}
    </div>
  );
}