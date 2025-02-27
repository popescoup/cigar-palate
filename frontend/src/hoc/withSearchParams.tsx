// src/hoc/withSearchParams.tsx
'use client';

import { Suspense } from 'react';
import LoadingSpinner from '@/app/components/loading';
import { useSearchParams } from 'next/navigation';

// Create a wrapper component that uses useSearchParams
function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  // This forces the component to be client-side rendered
  useSearchParams();
  return children;
}

export function withSearchParams<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithSearchParamsWrapper(props: P) {
    return (
      <Suspense fallback={<LoadingSpinner isGlobal size="md" delay={50} />}>
        <SearchParamsWrapper>
          <Component {...props} />
        </SearchParamsWrapper>
      </Suspense>
    );
  };
}