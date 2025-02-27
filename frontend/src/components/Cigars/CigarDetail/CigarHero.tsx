import React from 'react';
import { useMutation, useQuery, QueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import axios from 'axios';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User } from '@/types/user';
import type { Cigar } from '@/types/cigars';
import ShareButton from '@/components/ShareButton';
import { api } from '@/utils/axiosConfig';

interface CigarHeroProps {
  cigar: Cigar;
  currentUser: User | null;
  queryClient: QueryClient;
}

const CigarHero: React.FC<CigarHeroProps> = ({
  cigar,
  currentUser,
  queryClient,
}) => {
  // Query for bookmark status
  const { data: isBookmarked = false } = useQuery({
    queryKey: ['bookmarkStatus', cigar.id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/bookmarks/cigars/${cigar.id}/check`);
        return data.isBookmarked;
      } catch (err) {
        console.error('Error checking bookmark status:', err);
        return false;
      }
    },
    enabled: !!cigar.id && !!currentUser
  });

  // Query for cigar data
  const { data: cigarData } = useQuery({
    queryKey: ['cigar', cigar.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/cigars/${cigar.id}`);
      return data;
    },
    initialData: cigar
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      let response;
      if (isBookmarked) {
        response = await api.delete(`/api/bookmarks/cigars/${cigar.id}`);
      } else {
        response = await api.post(`/api/bookmarks/cigars/${cigar.id}`);
      }
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['bookmarkStatus', cigar.id] });
      await queryClient.cancelQueries({ queryKey: ['cigar', cigar.id] });

      const previousBookmarkStatus = queryClient.getQueryData(['bookmarkStatus', cigar.id]);
      const previousCigar = queryClient.getQueryData(['cigar', cigar.id]);

      const newBookmarkStatus = !isBookmarked;
      queryClient.setQueryData(['bookmarkStatus', cigar.id], newBookmarkStatus);
      queryClient.setQueryData(['cigar', cigar.id], (old: any) => ({
        ...old,
        total_bookmarks: Math.max(0, (old.total_bookmarks || 0) + (newBookmarkStatus ? 1 : -1))
      }));

      return { previousBookmarkStatus, previousCigar };
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(['bookmarkStatus', cigar.id], context.previousBookmarkStatus);
        queryClient.setQueryData(['cigar', cigar.id], context.previousCigar);
      }
      console.error('Bookmark error:', error);
      alert('Failed to update bookmark');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkStatus', cigar.id] });
      queryClient.invalidateQueries({ queryKey: ['cigar', cigar.id] });
    }
  });

  const handleBookmarkToggle = () => {
    if (!currentUser) {
      alert('Please log in to bookmark cigars');
      return;
    }
    bookmarkMutation.mutate();
  };

  return (
    <div className="mb-0 flex justify-between items-start">
      <div>
        <div className="flex items-center gap-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-gray-900">
  {cigarData.name}
</h1>
          <ShareButton cigar={cigar} />
        </div>
        {cigarData.brand_id ? (
          <Link 
          href={`/brands/${cigarData.brand_id}`}
          className="mt-1 sm:mt-2 text-base sm:text-lg text-gray-600 hover:text-primary transition-colors underline decoration-gray-400 hover:decoration-primary inline-block"
        >
          {cigarData.brand?.name || 'Unknown Brand'}
        </Link>
        ) : (
          <span className="mt-2 text-lg text-gray-600">
            Unknown Brand
          </span>
        )}
      </div>
      <div className="flex items-center">
      <TooltipProvider delayDuration={200}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={handleBookmarkToggle}
        disabled={bookmarkMutation.isPending || !currentUser}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-6 h-6 text-primary" />
        ) : (
          <Bookmark className={`w-6 h-6 ${currentUser ? 'text-gray-400 hover:text-primary' : 'text-gray-300'}`} />
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent>
      <p>
        {!currentUser 
          ? "Log in to add this cigar to your personal humidor"
          : isBookmarked 
            ? "Remove from My Humidor" 
            : "Add to My Humidor"
        }
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
        <span className="text-gray-500 -ml-1">{cigarData.total_bookmarks || 0}</span>
      </div>
    </div>
  );
};

export default CigarHero;