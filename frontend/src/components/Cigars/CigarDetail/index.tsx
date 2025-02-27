import React, { Suspense, lazy } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cigar, Review } from '@/types/cigars';
import { api } from '@/utils/axiosConfig';

// Import primary components normally
import CigarHero from './CigarHero';
import CigarGallery from './CigarGallery';
import CigarInfo, { CigarDescription } from './CigarInfo';
import CigarRating from './CigarRating';
import CigarFlavors from './CigarFlavors';

// Lazy load secondary components
const CigarBars = lazy(() => import('./CigarBars'));
const CigarReviews = lazy(() => import('./CigarReviews'));

// API fetch functions
const fetchCigarDetails = async (id: string) => {
  const { data } = await api.get(`/api/cigars/${id}`);
  return data;
};

const fetchFlavorRankings = async (id: string) => {
  const { data } = await api.get(`/api/cigars/${id}/flavor-rankings`, {
  });
  return data;
};

const fetchBrandCigars = async (brandId: number, currentCigarId?: string) => {
  const { data } = await api.get(`/api/brands/${brandId}/other-cigars`, {
    params: { excludeCigarId: currentCigarId },
  });
  return data;
};

const fetchSimilarCigars = async (id: string) => {
  const { data } = await api.get(`/api/cigars/${id}/similar`, {
  });
  return data;
};

const fetchBookmarkStatus = async (id: string) => {
  const { data } = await api.get(`/api/bookmarks/cigars/${id}/check`, {
  });
  return data.isBookmarked;
};

const fetchUserRating = async (id: string) => {
  const { data } = await api.get(`/api/cigars/${id}/user-rating`, {
  });
  return data;
};

export default function CigarDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  // Primary data queries
  const { 
    data: cigar,
    isLoading: isLoadingCigar,
    isError: isCigarError,
    error: cigarError
  } = useQuery({
    queryKey: ['cigar', id],
    queryFn: () => fetchCigarDetails(id as string),
    enabled: !!id
  });

  // Additional primary data queries
  const {
    data: flavorRankingsData,
    isLoading: isLoadingFlavors
  } = useQuery({
    queryKey: ['flavorRankings', id],
    queryFn: () => fetchFlavorRankings(id as string),
    enabled: !!id,
    select: (data) => {
      if (!cigar?.flavors) return [];
      
      let parsedFlavors;
      try {
        // Handle both array and JSON string cases
        parsedFlavors = typeof cigar.flavors === 'string' 
          ? JSON.parse(cigar.flavors)
          : cigar.flavors;
          
        // Validate that we have an array
        if (!Array.isArray(parsedFlavors)) {
          console.warn('Invalid flavors data format');
          return [];
        }
        
        // Filter out any invalid values
        parsedFlavors = parsedFlavors.filter(flavor => 
          typeof flavor === 'string' && flavor !== 'Edit'
        );
        
        return parsedFlavors.map((flavor: string) => ({
          flavor,
          averageRank: data[flavor] || 0,
          userRank: null
        }));
      } catch (error) {
        console.error('Error parsing flavors:', error);
        return [];
      }
    }
  });

  const {
    data: userRatingData,
    isLoading: isLoadingUserRating
  } = useQuery({
    queryKey: ['userRating', id],
    queryFn: () => fetchUserRating(id as string),
    enabled: !!id && !!currentUser
  });

  const {
    data: isBookmarked = false,
    isLoading: isLoadingBookmark
  } = useQuery({
    queryKey: ['bookmarkStatus', id],
    queryFn: () => fetchBookmarkStatus(id as string),
    enabled: !!id && !!currentUser
  });

  // Secondary data queries - moved to their respective components
  const {
    data: brandCigars = [],
    isLoading: isLoadingBrandCigars
  } = useQuery({
    queryKey: ['brandCigars', cigar?.brand_id, id],
    queryFn: () => fetchBrandCigars(cigar!.brand_id, id as string),
    enabled: !!cigar?.brand_id
  });

  const {
    data: similarCigars = [],
    isLoading: isLoadingSimilar
  } = useQuery({
    queryKey: ['similarCigars', id],
    queryFn: () => fetchSimilarCigars(id as string),
    enabled: !!id
  });

  const onRatingSubmit = (newAverage: number, newCount: number) => {
    queryClient.setQueryData(['cigar', id], (oldData: any) => ({
      ...oldData,
      averageRating: newAverage,
      numberOfRatings: newCount
    }));
    queryClient.setQueryData(['userRating', id], {
      hasRated: true
    });
  };

  // Loading state for primary content only
  const isPrimaryLoading = 
    isLoadingCigar || 
    isLoadingFlavors || 
    (!!currentUser && (isLoadingBookmark || isLoadingUserRating));

  if (isPrimaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isCigarError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertDescription>
            {cigarError instanceof Error ? cigarError.message : 'Failed to load cigar details'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!cigar) return null;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <CigarHero 
          cigar={cigar}
          currentUser={currentUser}
          queryClient={queryClient}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4 sm:gap-6 lg:gap-8 lg:grid-areas-[gallery_rating,info_flavors]">
          {/* Rating Section */}
          <div className="lg:col-start-2 order-2 lg:order-none lg:self-start">
            <CigarRating 
              cigar={cigar}
              userRatingData={userRatingData}
              currentUser={currentUser}
              queryClient={queryClient}
              onRatingSubmit={onRatingSubmit}
            />
          </div>

          {/* Gallery Section */}
          <div className="lg:col-start-1 lg:row-start-1 order-3 lg:order-none">
            <CigarGallery cigar={cigar} />
          </div>

          {/* Info Section */}
          <div className="lg:col-start-1 lg:row-start-2 order-4 lg:order-none">
            <div className="space-y-4">
              <CigarDescription cigar={cigar} />
              <CigarInfo cigar={cigar} />
            </div>
          </div>

          {/* Flavors Section */}
          <div className="lg:col-start-2 lg:row-start-2 order-5 lg:order-none lg:relative lg:h-full flex flex-col">
            <div className="lg:mt-auto">
              <CigarFlavors 
                flavorRankings={flavorRankingsData || []}
                currentUser={currentUser}
                queryClient={queryClient}
                cigarId={id as string}
              />
            </div>
          </div>
        </div>
        
        {/* Secondary Content with Loading States */}
        <Suspense 
          fallback={
            <div className="mt-16 flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          }
        >
          {/* Similar Cigars and Brand Cigars */}
          <div className="mt-16 border-t border-gray-200">
            <div className="pt-8">
              <CigarBars 
                similarCigars={similarCigars}
                brandCigars={brandCigars}
                brandName={cigar.brand?.name}
              />
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="mt-16 border-t border-gray-200">
            <div className="pt-8">
              <CigarReviews 
                currentUser={currentUser}
                queryClient={queryClient}
                cigarId={id as string}
              />
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
}