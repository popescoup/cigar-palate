'use client'

import React, { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Thread, CreateThreadData } from '@/types/forum';
import CreateThreadModal from './CreateThreadModal';
import ThreadsList from './ThreadsList';
import SortControl, { SortOption } from './SortControl';
import { useInView } from 'react-intersection-observer';

interface ThreadsResponse {
  threads: Thread[];
  currentPage: number;
  totalPages: number;
  totalThreads: number;
}

const fetchThreadsPage = async ({ 
  pageParam = 1, 
  sortOption 
}: { 
  pageParam?: number; 
  sortOption: SortOption 
}): Promise<ThreadsResponse> => {
  const { data } = await axios.get(
  `/api/threads?page=${pageParam}&limit=10&sortBy=${sortOption}`,
    { withCredentials: true }
  );
  return data;
};

const ForumPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption>('trending');
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['threads', sortOption],
    queryFn: ({ pageParam }) => fetchThreadsPage({ pageParam, sortOption }),
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Refetch when sort option changes
  useEffect(() => {
    refetch();
  }, [sortOption, refetch]);

  const createThreadMutation = useMutation({
    mutationFn: async (threadData: CreateThreadData | FormData) => {
        try {
            const response = await axios.post(
                '/api/threads',
                threadData,
                {
                    headers: threadData instanceof FormData ? undefined : {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.details || error.response.data.error || 'Failed to create thread');
            }
            throw error;
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['threads'] });
        setIsCreateModalOpen(false);
    }
});

  const handleCreateThread = async (threadData: CreateThreadData | FormData) => {
    try {
      await createThreadMutation.mutate(threadData);
    } catch (error) {
      console.error('Error in handleCreateThread:', error);
      throw error;
    }
  };

  // Combine all pages of threads
  const allThreads = data?.pages.flatMap(page => page.threads) ?? [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
    <h1 className="text-2xl sm:text-3xl font-bold text-white">Cigar Forum</h1>
    <div className="w-full sm:w-auto sm:ml-4">
      <SortControl currentSort={sortOption} onSortChange={setSortOption} />
    </div>
  </div>
  <button
    onClick={() => setIsCreateModalOpen(true)}
    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
  >
    Create New Thread
  </button>
</div>

      {status === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{(error as Error)?.message || 'Failed to load threads'}</p>
        </div>
      )}

      {status === 'pending' ? (
        <div className="text-center py-8 text-white">Loading...</div>
      ) : allThreads.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No threads found. Be the first to create one!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <ThreadsList threads={allThreads} />
          </div>
          
          {/* Infinite scroll trigger */}
          <div ref={ref} className="h-10 mt-4">
            {isFetchingNextPage && (
              <div className="text-center text-gray-400">Loading more threads...</div>
            )}
          </div>
        </>
      )}

      <CreateThreadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateThread={handleCreateThread}
      />
    </div>
  );
};

export default ForumPage;