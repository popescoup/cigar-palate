// providers/Providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { initializeAxiosInterceptors } from '@/utils/axiosConfig';
import axios from 'axios';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 30,
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        gcTime: 1000 * 60 * 60,
      },
      mutations: {
        // Only retry for network-related errors, not server errors
        retry: (failureCount, error) => {
          // Don't retry more than once
          if (failureCount >= 1) return false;
          
          // If it's an Axios error, check specifics
          if (axios.isAxiosError(error)) {
            // Only retry if no response was received (network error)
            // or if it's a 408 (timeout) or 429 (too many requests)
            return !error.response || 
                   error.response.status === 408 || 
                   error.response.status === 429;
          }
          
          // For non-Axios errors, retry once
          return true;
        },
        onError: (error) => {
          console.error('Mutation error:', error);
        }
      },
    },
  }));

  useEffect(() => {
    // Initialize axios interceptors with query client
    initializeAxiosInterceptors(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}