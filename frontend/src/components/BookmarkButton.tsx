import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Tooltip from '@/components/Forum/Tooltip';

interface BookmarkButtonProps {
  threadId: number;
  initialBookmarkCount: number;
  size?: 'small' | 'regular';
  showCount?: boolean;
  isLoggedIn?: boolean;
  className?: string;  // Add className prop
}

const BookmarkButton = ({ 
  threadId, 
  initialBookmarkCount,
  size = 'regular',
  showCount = true,
  isLoggedIn = false,
  className = ''
}: BookmarkButtonProps) => {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  // Updated to use relative URL
  const { data: bookmarkData } = useQuery({
    queryKey: ['threadBookmark', threadId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/thread-bookmarks/${threadId}/check`,
        { withCredentials: true }
      );
      return data;
    },
    enabled: !!currentUser
  });

  const isBookmarked = bookmarkData?.isBookmarked || false;
  const bookmarkCount = bookmarkData?.total_bookmarks ?? initialBookmarkCount;

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!isLoggedIn) return;
      
      if (isBookmarked) {
        await axios.delete(`/api/thread-bookmarks/${threadId}`, {
          withCredentials: true
        });
      } else {
        await axios.post(`/api/thread-bookmarks/${threadId}`, {}, {
          withCredentials: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadBookmark', threadId] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    }
  });

  const handleBookmarkToggle = () => {
    if (!currentUser) {
      return;
    }
    bookmarkMutation.mutate();
  };

  const buttonContent = (
    <button
      onClick={handleBookmarkToggle}
      className={`${className} ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={!isLoggedIn}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {isBookmarked ? (
        <BookmarkCheck 
          className={`${size === 'small' ? 'w-4 h-4' : 'w-6 h-6'} text-primary`} 
        />
      ) : (
        <Bookmark 
          className={`${size === 'small' ? 'w-4 h-4' : 'w-6 h-6'} text-gray-400 hover:text-primary`} 
        />
      )}
    </button>
  );

  // Remove the space-x-1 class to match CigarHero styling
  return (
    <div className="flex items-center">
      {isLoggedIn ? (
        buttonContent
      ) : (
        <Tooltip content="Log in to bookmark">
          {buttonContent}
        </Tooltip>
      )}
      {showCount && !className && <span className="text-gray-500">({bookmarkCount})</span>}
    </div>
  );
};

export default BookmarkButton;