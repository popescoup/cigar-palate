'use client';

import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';
import Pagination from '@/components/ui/pagination';
import { DiscoverCigarCard } from '@/components/Discover/DiscoverCigarCard';
import { DiscoverBrandCard } from '@/components/Discover/DiscoverBrandCard';
import { useSearchParams, useRouter } from 'next/navigation';
import RecommendationsAuthRequired from '@/components/RecommendationsAuthRequired';

type TabType = 'recommended' | 'top-rated-cigars' | 'trending-cigars' | 'top-rated-brands' | 'trending-brands';

interface Cigar {
  id: number;
  name: string;
  averageRating: number | null;
  numberOfRatings: number;
  totalRecentInteractions?: number;
  similarityScore?: number;
  image_key?: string;
  flavors?: string;
  price_range?: string;
  brand?: {
    name: string;
  };
}

interface Brand {
  id: number;
  name: string;
  avgRating: number | null;
  cigarCount: number;
  totalRecentInteractions?: number;
  image_key?: string;
}

interface PaginatedData<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  total: number;
}

interface RecommendationResponse {
  cigars: Cigar[];
  hasMore: boolean;
  message?: string;
  currentPage: number;
  isLoggedIn: boolean;
  nextPage?: number;
}

// API fetching functions
const fetchRecommendations = async ({ pageParam = 1 }): Promise<RecommendationResponse> => {
  const response = await fetch(
    `/api/recommendations?page=${pageParam}`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
};

const fetchPaginatedData = async (tab: TabType, page: number): Promise<PaginatedData<Cigar | Brand>> => {
  let endpoint: string;
  switch (tab) {
    case "top-rated-cigars":
      endpoint = `/api/cigars/top-rated/all?page=${page}`;
      break;
    case "trending-cigars":
      endpoint = `/api/cigars/trending/all?page=${page}`;
      break;
    case "top-rated-brands":
      endpoint = `/api/brands/top-rated/all?page=${page}`;
      break;
    case "trending-brands":
      endpoint = `/api/brands/trending/all?page=${page}`;
      break;
    default:
      endpoint = `/api/cigars/top-rated/all?page=${page}`;
  }

  const response = await fetch(endpoint);
  if (!response.ok) throw new Error('Failed to fetch data');
  const json = await response.json();
  
  return {
    items: tab.includes('cigars') ? json.cigars : json.brands,
    currentPage: json.currentPage,
    totalPages: json.totalPages,
    total: tab.includes('cigars') ? json.totalCigars : json.totalBrands
  };
};

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize activeTab from URL parameter or default to 'recommended'
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['recommended', 'top-rated-cigars', 'trending-cigars', 'top-rated-brands', 'trending-brands'].includes(tabParam)) {
      return tabParam as TabType;
    }
    return 'recommended';
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    setActiveTab(newTab);
    setCurrentPage(1);
    router.push(`/discover?tab=${newTab}`);
  };

  const { data: authData, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['authStatus'],
    queryFn: async () => {
      const response = await fetch('/api/auth/status', { 
        credentials: 'include' 
      });
      if (!response.ok) return { isLoggedIn: false };
      return response.json();
    }
  });

  const { 
    data: recommendationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? (lastPage.currentPage + 1) : undefined,
    enabled: activeTab === 'recommended' && !isLoadingAuth && authData?.isLoggedIn === true
  });

  const {
    data: paginatedData,
    isLoading: isLoadingData,
  } = useQuery({
    queryKey: ['discover', activeTab, currentPage],
    queryFn: () => fetchPaginatedData(activeTab, currentPage),
    enabled: activeTab !== 'recommended',
    retry: false
  });

  const loadMoreRecommendations = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const allRecommendations = recommendationsData?.pages.flatMap(page => page.cigars) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = (position: 'top' | 'bottom') => {
    if (!paginatedData) return null;
    
    return paginatedData.totalPages > 1 ? (
      <div className={position === 'top' ? 'mb-6' : 'mt-6'}>
        <Pagination
          currentPage={paginatedData.currentPage}
          totalPages={paginatedData.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    ) : null;
  };

  const renderCigarGrid = (cigars: Cigar[], variant?: 'recommended' | 'rated' | 'trending') => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {cigars.map((cigar: Cigar) => (
        <DiscoverCigarCard 
          key={cigar.id} 
          cigar={cigar}
          variant={variant}
        />
      ))}
    </div>
  );
  
  const renderBrandGrid = (brands: Brand[], variant?: 'rated' | 'trending') => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {brands.map((brand: Brand) => (
        <DiscoverBrandCard
          key={brand.id}
          brand={brand}
          variant={variant}
        />
      ))}
    </div>
  );

  const renderNotLoggedInMessage = () => (
    <div className="text-center py-8">
      <p className="text-gray-700 mb-2">
        Please <Link href="/login" className="text-blue-600 hover:text-blue-800">log in</Link> to see your personalized recommendations
      </p>
      <p className="text-gray-600">
        Don't have an account? Make one <Link href="/register" className="text-blue-600 hover:text-blue-800">here</Link>.
      </p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Discover</h1>
        
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="mb-6 sm:mb-8 inline-flex min-w-full sm:min-w-0">
            <TabsTrigger value="recommended" className="text-sm sm:text-base whitespace-nowrap">
              Recommended
            </TabsTrigger>
            <TabsTrigger value="top-rated-cigars" className="text-sm sm:text-base whitespace-nowrap">
              Top-Rated Cigars
            </TabsTrigger>
            <TabsTrigger value="trending-cigars" className="text-sm sm:text-base whitespace-nowrap">
              Trending Cigars
            </TabsTrigger>
            <TabsTrigger value="top-rated-brands" className="text-sm sm:text-base whitespace-nowrap">
              Top-Rated Brands
            </TabsTrigger>
            <TabsTrigger value="trending-brands" className="text-sm sm:text-base whitespace-nowrap">
              Trending Brands
            </TabsTrigger>
          </TabsList>
        </div>
  
        {(activeTab !== 'recommended' && isLoadingData) || (activeTab === 'recommended' && isLoadingAuth) ? (
  <div className="flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
  </div>
        ) : (
          <>
            <TabsContent value="recommended">
            {!authData?.isLoggedIn ? (
  <RecommendationsAuthRequired />
) : recommendationsData?.pages[0]?.message ? (
                <p className="text-gray-500 text-center py-8">{recommendationsData.pages[0].message}</p>
              ) : (
                <InfiniteScroll
                  dataLength={allRecommendations.length}
                  next={loadMoreRecommendations}
                  hasMore={!!hasNextPage}
                  loader={
                    <div className="flex justify-center my-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  }
                  endMessage={
                    <p className="text-gray-500 text-center py-4">
                      No more recommendations available. Please add more cigars to your humidor to further develop your recommendation profile.
                    </p>
                  }
                >
                  {renderCigarGrid(allRecommendations, 'recommended')}
                </InfiniteScroll>
              )}
            </TabsContent>
  
            <TabsContent value="top-rated-cigars">
              {paginatedData?.items && paginatedData.items.length > 0 && (
                <>
                  {renderPagination('top')}
                  {renderCigarGrid(paginatedData.items as Cigar[], 'rated')}
                  {renderPagination('bottom')}
                </>
              )}
            </TabsContent>
  
            <TabsContent value="trending-cigars">
              {paginatedData?.items && paginatedData.items.length > 0 && (
                <>
                  {renderPagination('top')}
                  {renderCigarGrid(paginatedData.items as Cigar[], 'trending')}
                  {renderPagination('bottom')}
                </>
              )}
            </TabsContent>
  
            <TabsContent value="top-rated-brands">
              {paginatedData?.items && paginatedData.items.length > 0 && (
                <>
                  {renderPagination('top')}
                  {renderBrandGrid(paginatedData.items as Brand[], 'rated')}
                  {renderPagination('bottom')}
                </>
              )}
            </TabsContent>
  
            <TabsContent value="trending-brands">
              {paginatedData?.items && paginatedData.items.length > 0 && (
                <>
                  {renderPagination('top')}
                  {renderBrandGrid(paginatedData.items as Brand[], 'trending')}
                  {renderPagination('bottom')}
                </>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}