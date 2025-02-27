'use client';

import { withSearchParams } from '@/hoc/withSearchParams';

function PageWrapper({ children }: { children: React.ReactNode }) {
  return children;
}

export default withSearchParams(PageWrapper);