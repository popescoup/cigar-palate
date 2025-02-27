// src/components/RootSuspense.tsx
'use client';

import { Suspense } from 'react';
import LoadingSpinner from '@/app/components/loading';
import { useSearchParams } from 'next/navigation';

function ClientComponent({ children }: { children: React.ReactNode }) {
  // Force client-side rendering
  useSearchParams();
  return children;
}

export function RootSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner isGlobal size="md" delay={50} />}>
      <ClientComponent>{children}</ClientComponent>
    </Suspense>
  );
}