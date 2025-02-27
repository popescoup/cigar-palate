// app/cigars/page.tsx
import { CigarsList } from '@/components/Cigars/CigarsList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cigar Collection',
  description: 'Browse our collection of fine cigars',
};

export default function CigarsPage() {
  return <CigarsList />;
}