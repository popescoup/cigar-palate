'use client';

import React, { useState } from 'react';
import { Package, Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/axiosConfig';  // Import the configured axios instance
import { validateSearchQuery } from '@/app/components/SearchBar';

interface SiteStats {
  totalCigars: number;
  totalMembers: number;
  totalReviews: number;
  totalBrands: number;
}

const fetchSiteStats = async (): Promise<SiteStats> => {
  const { data } = await api.get('/api/stats/site', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  return data;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M+';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K+';
  }
  return num.toString();
};

const HeroSection = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
const [searchError, setSearchError] = useState<string | null>(null);
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['siteStats'],
    queryFn: fetchSiteStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 30, // 30 minutes
    retry: 2
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
  
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchError('Please enter a search term');
      return;
    }
  
    const { isValid, error } = validateSearchQuery(trimmedQuery);
    if (!isValid) {
      setSearchError(error);
      return;
    }
  
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}&type=all`);
  };

  const navigateToAddCigar = () => router.push('/add-cigar');

  if (isLoading) {
    return (
      <div className="relative border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500">
          Unable to load site statistics
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-b border-gray-200 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8 lg:py-10">
          {/* Main Content */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-gray-900 mb-4 sm:mb-6">
              CigarPalate.com
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Join other cigar enthusiasts discovering premium cigars, sharing experiences, and making informed purchases.
            </p>
            
            {/* Search Section */}
            <div className="max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
              <form onSubmit={handleSearch} className="relative">
              <div className="relative">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => {
      const value = e.target.value;
      setSearchQuery(value);
      if (value.trim()) {
        const { error } = validateSearchQuery(value);
        setSearchError(error);
      } else {
        setSearchError(null);
      }
    }}
    placeholder="Search cigars, brands, and discussions..."
    maxLength={100}
    className={`w-full py-2.5 sm:py-3 pl-4 pr-12 text-base bg-gray-50 border ${
      searchError ? 'border-red-500' : 'border-gray-100'
    } rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent`}
  />
  {searchError && (
    <p className="absolute -bottom-6 left-0 text-xs text-red-500">{searchError}</p>
  )}
</div>
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 sm:px-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                </button>
              </form>
              <p className="text-sm text-gray-500 mt-2 sm:mt-3 px-2">
                Explore our extensive collection of cigars, read reviews, and join discussions
              </p>
            </div>

            {/* Action Buttons - Stack on mobile */}
            <div className="mb-8 sm:mb-10 px-4">
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-3">
                <Button 
                  onClick={navigateToAddCigar}
                  className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800 py-5 sm:py-6 px-6 sm:px-8 text-base sm:text-lg"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Add Cigar
                </Button>
                <Button 
                  onClick={() => router.push('/discover?tab=recommended')}
                  variant="outline"
                  className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-50 border-gray-200 py-5 sm:py-6 px-6 sm:px-8 text-base sm:text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Find My Next Perfect Smoke
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Begin contributing to our community or find your next favorite cigar
              </p>
            </div>

            {/* Stats Section */}
            {stats && (
              <div className="mt-10 sm:mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                <div className="mx-auto">
                  <p className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
                    {formatNumber(stats.totalCigars)}
                  </p>
                  <p className="text-xs sm:text-sm leading-6 text-gray-600">Premium Cigars</p>
                </div>
                <div className="mx-auto">
                  <p className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
                    {formatNumber(stats.totalMembers)}
                  </p>
                  <p className="text-xs sm:text-sm leading-6 text-gray-600">Active Members</p>
                </div>
                <div className="mx-auto">
                  <p className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
                    {formatNumber(stats.totalReviews)}
                  </p>
                  <p className="text-xs sm:text-sm leading-6 text-gray-600">Total Reviews</p>
                </div>
                <div className="mx-auto">
                  <p className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
                    {formatNumber(stats.totalBrands)}
                  </p>
                  <p className="text-xs sm:text-sm leading-6 text-gray-600">Brands</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;