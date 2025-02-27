// components/Cigars/CigarsList/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CigarCard from './CigarCard';
import Pagination from '@/components/ui/pagination';
import { AlphabeticalList } from './ListView';
import { useInfiniteCigars } from '@/hooks/useInfiniteCigars';
import { Cigar } from '@/types/cigars';

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCigars: number;
}

interface CigarsResponse {
  cigars: Cigar[];
  currentPage: number;
  totalPages: number;
  totalCigars: number;
}

type ViewMode = 'grid' | 'list';

// API fetching function for grid view
const fetchCigars = async (page: number): Promise<CigarsResponse> => {
  const { data } = await axios.get(`/api/cigars?page=${page}`);
  return data;
};

export const CigarsList: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  // Load view preference from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('cigarViewMode') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cigarViewMode', viewMode);
  }, [viewMode]);

  // Grid view query
  const { 
    data: gridData,
    isLoading: isGridLoading,
    isError: isGridError,
    error: gridError
  } = useQuery({
    queryKey: ['cigars', page],
    queryFn: () => fetchCigars(page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData,
    enabled: viewMode === 'grid'
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
  } = useInfiniteCigars();

  const isLoading = viewMode === 'grid' ? isGridLoading : isListLoading;
  const isError = viewMode === 'grid' ? isGridError : isListError;
  const error = viewMode === 'grid' ? gridError : listError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load cigars. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">All Cigars</h1>
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
  
      {viewMode === 'grid' && gridData && gridData.cigars.length > 0 ? (
        <>
          {/* Top Pagination */}
          {gridData.totalPages > 1 && (
            <div className="mb-4 sm:mb-6">
              <Pagination
                currentPage={gridData.currentPage}
                totalPages={gridData.totalPages}
                onPageChange={setPage}
                className="text-sm sm:text-base"
              />
            </div>
          )}
  
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {gridData.cigars.map(cigar => (
              <CigarCard key={cigar.id} cigar={cigar} />
            ))}
          </div>
  
          {/* Bottom Pagination */}
          {gridData.totalPages > 1 && (
            <div className="mt-4 sm:mt-6">
              <Pagination
                currentPage={gridData.currentPage}
                totalPages={gridData.totalPages}
                onPageChange={setPage}
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
          No cigars available
        </div>
      )}
    </div>
  );
};