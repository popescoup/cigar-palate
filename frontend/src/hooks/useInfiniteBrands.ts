// hooks/useInfiniteBrands.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

interface SimpleBrand {
  id: string | number;
  name: string;
}

interface BrandsResponse {
  brands: SimpleBrand[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

interface FetchBrandPageParams {
  queryKey: string[];
  pageParam?: string | null;
}

const fetchBrandPage = async ({ pageParam }: FetchBrandPageParams): Promise<BrandsResponse> => {
  const { data } = await axios.get<BrandsResponse>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands/alphabetical`, 
    {
      params: {
        cursor: pageParam,
        limit: 100
      }
    }
  );
  return data;
};

export const useInfiniteBrands = () => {
  return useInfiniteQuery({
    queryKey: ['brands', 'alphabetical'],
    queryFn: fetchBrandPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};