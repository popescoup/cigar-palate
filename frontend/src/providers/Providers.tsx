// providers/Providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { initializeAxiosInterceptors } from '@/utils/axiosConfig';

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
        retry: 1,
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