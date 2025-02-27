// src/hooks/useHomeData.ts
import { useQuery } from '@tanstack/react-query';

interface UseHomeDataProps {
  type: 'cigars' | 'brands';
  category: 'top-rated' | 'trending';
}

export function useHomeData({ type, category }: UseHomeDataProps) {
  return useQuery({
    queryKey: [type, category],
    queryFn: () => fetch(`/api/${type}/${category}`).then(r => r.json()),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}