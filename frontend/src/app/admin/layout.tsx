// src/app/admin/layout.tsx
"use client";
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && (!currentUser || !currentUser.isAdmin)) {
      router.push('/');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div>
      {/* You can add admin navigation or other admin-specific UI here */}
      <main>{children}</main>
    </div>
  );
}