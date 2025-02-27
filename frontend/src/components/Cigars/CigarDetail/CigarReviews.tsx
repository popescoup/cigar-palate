import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, QueryClient, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import VoteButtons from '@/components/Forum/VoteButtons';
import Username from '@/components/Username';
import ReviewReply from './ReviewReply';
import type { User } from '@/types/user';
import type { Review } from '@/types/cigars';
import type { ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/utils/axiosConfig';

const MIN_REVIEW_LENGTH = 1;
const MAX_REVIEW_LENGTH = 1000;
const PAGE_SIZE = 25;

interface CigarReviewsProps {
  currentUser: User | null;
  queryClient: QueryClient;
  cigarId: string;
}

const sanitizeReviewText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

const CigarReviews: React.FC<CigarReviewsProps> = ({
  currentUser,
  queryClient,
  cigarId,
}) => {
  const [reviewText, setReviewText] = useState('');
  const [reviewFilter, setReviewFilter] = useState<string>('mostLiked');
  const [validationError, setValidationError] = useState<string>('');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const highlightedReviewId = searchParams.get('highlight');
  const highlightedReviewRef = useRef<HTMLDivElement>(null);

  const remainingChars = MAX_REVIEW_LENGTH - reviewText.length;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['reviews', cigarId, reviewFilter, highlightedReviewId],
    queryFn: async ({ pageParam = 0 }) => {
      // If we have a highlighted review and this is the first fetch
      if (highlightedReviewId && pageParam === 0) {
        try {
          // First try to find which page contains the highlighted review
          const { data: pageData } = await api.get(
            `/api/cigars/${cigarId}/review-page/${highlightedReviewId}`,
            {
              params: { filter: reviewFilter }
            }
          );
          
          // Calculate how many pages we need to fetch
          const targetPage = pageData.page;
          const pagesToFetch = targetPage + 1;
          
          // Fetch all pages up to and including the target page
          const responses = await Promise.all(
            Array.from({ length: pagesToFetch }, (_, i) => 
              api.get(`/api/cigars/${cigarId}/reviews`, {
                params: {
                  filter: reviewFilter,
                  offset: i * PAGE_SIZE,
                  limit: PAGE_SIZE,
                  userId: currentUser?.id
                },
              })
            )
          );
  
          // Combine all reviews from all fetched pages
          const allReviews = responses.flatMap(response => response.data.reviews);
          
          // Return with the last page's pagination info but all reviews combined
          const lastResponse = responses[responses.length - 1].data;
          return {
            ...lastResponse,
            reviews: allReviews,
            pagination: {
              ...lastResponse.pagination,
              currentPage: pagesToFetch
            }
          };
        } catch (error) {
          console.error('Error fetching highlighted review:', error);
          // If there's an error, fall back to regular first page fetch
          const response = await api.get(`/api/cigars/${cigarId}/reviews`, {
            params: {
              filter: reviewFilter,
              offset: pageParam,
              limit: PAGE_SIZE,
              userId: currentUser?.id
            }
          });
          return response.data;
        }
      }
      
      // Regular page fetch
      const response = await api.get(`/api/cigars/${cigarId}/reviews`, {
        params: {
          filter: reviewFilter,
          offset: pageParam,
          limit: PAGE_SIZE,
          userId: currentUser?.id
        }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.currentPage * PAGE_SIZE;
    },
    initialPageParam: 0
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (highlightedReviewId && highlightedReviewRef.current) {
      setTimeout(() => {
        highlightedReviewRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [highlightedReviewId, data]);

  const reviews = useMemo(() => {
    return data?.pages.flatMap(page => page.reviews) ?? [];
  }, [data]);

  const validateReview = (text: string): boolean => {
    // Check for minimum length of actual content (not just whitespace)
    if (text.trim().length < MIN_REVIEW_LENGTH) {
      setValidationError(`Review must be at least ${MIN_REVIEW_LENGTH} characters long`);
      return false;
    }
  
    // Check maximum length
    if (text.length > MAX_REVIEW_LENGTH) {
      setValidationError(`Review cannot exceed ${MAX_REVIEW_LENGTH} characters`);
      return false;
    }
  
    // Check for repeated characters (potential spam)
    const repeatedCharsRegex = /(.)\1{4,}/;
    if (repeatedCharsRegex.test(text)) {
      setValidationError('Review contains too many repeated characters');
      return false;
    }
  
    // Check for minimum word count
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 1) {
      setValidationError('Review must contain at least 1 word');
      return false;
    }
  
    setValidationError('');
    return true;
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const rawText = e.target.value;
    const sanitizedText = sanitizeReviewText(rawText);
    setReviewText(sanitizedText);
    validateReview(sanitizedText);
  };

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/cigars/${cigarId}/reviews`, {
        comment: reviewText.trim()
      });
      return response.data;
    },
    onSuccess: () => {
      setReviewText('');
      setValidationError('');
      queryClient.invalidateQueries({ queryKey: ['reviews', cigarId, reviewFilter] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        console.error('Review submission error:', error);
      }
      alert('Failed to submit review');
    }
  });

  const handleReviewSubmit = () => {
    if (!currentUser) {
      alert('You must be logged in to leave a review');
      return;
    }
  
    if (!reviewText.trim()) {
      setValidationError('Please provide a comment');
      return;
    }

    if (!validateReview(reviewText.trim())) {
      return;
    }
    
    reviewMutation.mutate();
  };

  if (isError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-red-700">Error loading reviews. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Reviews</h2>
        
        <div className="space-y-6">
          {/* Review Input Section */}
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder={currentUser ? "Write your review..." : "Please log in to leave a review"}
                value={reviewText}
                onChange={handleTextChange}
                disabled={!currentUser || reviewMutation.isPending}
                maxLength={MAX_REVIEW_LENGTH}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                {remainingChars} characters remaining
              </div>
            </div>
            
            {validationError && (
              <p className="text-sm text-red-500">
                {validationError}
              </p>
            )}

            <button
              onClick={handleReviewSubmit}
              disabled={
                !currentUser || 
                reviewMutation.isPending || 
                !!validationError || 
                reviewText.length < MIN_REVIEW_LENGTH
              }
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : 'Submit Review'}
            </button>
          </div>

          {/* Filter Section */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {reviews.length} Reviews
            </h3>
            <select
              value={reviewFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setReviewFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="mostLiked">Most Liked</option>
              <option value="mostDisliked">Most Disliked</option>
              <option value="mostDiscussed">Most Discussed</option>
            </select>
          </div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
  <ReviewReply
    key={review.id}
    review={review}
    currentUser={currentUser}
    cigarId={cigarId}
    onReplySubmitted={() => {
      queryClient.invalidateQueries({ 
        queryKey: ['reviews', cigarId, reviewFilter] 
      });
    }}
    depth={0}
    queryClient={queryClient}
    highlightedReviewId={highlightedReviewId ?? undefined}
    highlightRef={highlightedReviewRef}
  />
))}

              {hasNextPage && (
                <div 
                  ref={loadMoreRef} 
                  className="flex justify-center py-4"
                >
                  {isFetchingNextPage && (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No reviews yet. Be the first to review!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CigarReviews;