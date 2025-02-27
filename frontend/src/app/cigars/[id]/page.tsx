'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import CigarDetail from '@/components/Cigars/CigarDetail';
import { Loader2 } from 'lucide-react';

// Create a client
const queryClient = new QueryClient();

export default function CigarDetailPage() {
  const { id } = useParams();

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense 
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        }
      >
        <CigarDetail />
      </Suspense>
    </QueryClientProvider>
  );
}