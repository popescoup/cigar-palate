// src/components/PageTemplate.tsx
'use client';

import { Suspense } from 'react';
import LoadingSpinner from '@/app/components/loading';
import { useSearchParams } from 'next/navigation';

interface PageTemplateProps {
  children: React.ReactNode;
}

function ClientContent({ children }: PageTemplateProps) {
  useSearchParams(); // Force client-side rendering
  return <>{children}</>;
}

export function PageTemplate({ children }: PageTemplateProps) {
  return (
    <Suspense fallback={<LoadingSpinner isGlobal size="md" delay={50} />}>
      <ClientContent>{children}</ClientContent>
    </Suspense>
  );
}