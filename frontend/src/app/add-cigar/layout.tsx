// app/add-cigar/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add New Cigar',
  description: 'Submit a new cigar to our database',
};

export default function AddCigarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}