import React, { useState } from 'react';
import { useMutation, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Cigar } from '@/types/cigars';
import type { User } from '@/types/user';

interface RatingResponse {
  newAverageRating: number;
  newNumberOfRatings: number;
}

interface CigarRatingProps {
  cigar: Cigar;
  userRatingData: { hasRated: boolean } | undefined;
  currentUser: User | null;
  queryClient: QueryClient;
  onRatingSubmit: (newAverage: number, newCount: number) => void;
}

const CigarRating: React.FC<CigarRatingProps> = ({
  cigar,
  userRatingData,
  currentUser,
  queryClient,
  onRatingSubmit,
}) => {
  const [userRating, setUserRating] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const hasRated = userRatingData?.hasRated || false;

  const ratingMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post<RatingResponse>(`/api/cigars/${cigar.id}/rate`, {
        rating: parseInt(userRating)
      }, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: (data) => {
      const calculateNewAverage = () => {
        const newTotal = cigar.averageRating * cigar.numberOfRatings + parseInt(userRating);
        const newCount = cigar.numberOfRatings + 1;
        return Math.round(newTotal / newCount);
      };

      const newAverage = data.newAverageRating ?? calculateNewAverage();
      const newCount = data.newNumberOfRatings ?? (cigar.numberOfRatings + 1);

      onRatingSubmit(Math.round(newAverage), newCount);
      setUserRating('');
      setValidationError('');
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        alert(error.response.data.error || 'Failed to submit rating');
      } else {
        console.error('Failed to submit rating', error);
        alert('Failed to submit rating');
      }
    }
  });

  const validateRating = (value: string): boolean => {
    if (value === '') {
      setValidationError('Please enter a rating');
      return false;
    }

    const numberValue = Number(value);
    
    if (!Number.isInteger(numberValue)) {
      setValidationError('Rating must be a whole number');
      return false;
    }

    if (numberValue < 0 || numberValue > 100) {
      setValidationError('Rating must be between 0 and 100');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserRating(value);
    if (value) {
      validateRating(value);
    } else {
      setValidationError('');
    }
  };

  const handleRatingSubmit = () => {
    if (validateRating(userRating)) {
      ratingMutation.mutate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
      <h3 className="text-lg sm:text-xl font-light text-gray-900">Rating</h3>
        <div className="flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-medium text-gray-900">
  {Math.round(cigar.averageRating)}
</span>
          <span className="text-xl text-gray-600">/ 100</span>
          <span className="text-sm text-gray-500 ml-2">
            ({cigar.numberOfRatings} ratings)
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          type="number"
          min="0"
          max="100"
          step="1"
          value={userRating}
          onChange={handleInputChange}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === '.' || e.key === '-' || e.key === 'e') {
              e.preventDefault();
            }
          }}
          placeholder="Rate (0-100)"
          className="w-full"
          disabled={hasRated || !currentUser}
        />
        
        <Button 
          onClick={handleRatingSubmit}
          disabled={!currentUser || hasRated || ratingMutation.isPending || !!validationError || !userRating}
          className="w-full"
        >
          {hasRated ? 'Already Rated' : 'Submit Rating'}
        </Button>
        
        {validationError && (
          <p className="text-sm text-red-500">
            {validationError}
          </p>
        )}
        
        {!currentUser && (
          <p className="text-sm text-gray-500">
            Please log in to rate this cigar
          </p>
        )}
        {hasRated && (
          <p className="text-sm text-gray-500">
            You have already rated this cigar
          </p>
        )}
        {ratingMutation.isError && (
          <p className="text-sm text-red-500">
            Failed to submit rating. Please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default CigarRating;