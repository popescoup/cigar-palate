// hooks/useInfiniteCigars.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

interface SimpleCigar {
  id: string;
  name: string;
}

interface CigarsResponse {
  cigars: SimpleCigar[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

// This is what our pages will look like in the infinite query
export interface CigarsInfiniteData {
  pages: CigarsResponse[];
  pageParams: (string | null)[];
}

interface FetchCigarPageParams {
  queryKey: string[];
  pageParam?: string | null;
}

const fetchCigarPage = async ({ pageParam }: FetchCigarPageParams): Promise<CigarsResponse> => {
  const { data } = await axios.get<CigarsResponse>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cigars/alphabetical`, 
    {
      params: {
        cursor: pageParam,
        limit: 100
      }
    }
  );
  return data;
};

export const useInfiniteCigars = () => {
  return useInfiniteQuery({
    queryKey: ['cigars', 'alphabetical'],
    queryFn: fetchCigarPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};