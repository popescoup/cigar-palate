'use client';

import { useQuery } from '@tanstack/react-query';
import AddCigarForm from '@/components/Cigars/AddCigar';
import AuthRequiredPage from '@/app/auth-required/page';
import LoadingSpinner from "../components/loading";

export default function AddCigarPage() {
  const { data: authData, isLoading } = useQuery({
    queryKey: ['authStatus'],
    queryFn: async () => {
      const response = await fetch('/api/auth/status', { 
        credentials: 'include' 
      });
      if (!response.ok) return { isLoggedIn: false };
      return response.json();
    }
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!authData?.isLoggedIn) {
    return <AuthRequiredPage />;
  }

  return <AddCigarForm />;
}