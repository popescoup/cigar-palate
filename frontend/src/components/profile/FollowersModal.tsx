// src/components/profile/FollowersModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Loader2, UserCheck, UserPlus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import axios from 'axios';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/axiosConfig';

interface User {
  id: number;
  username: string;
  isFollowing?: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
}

const FollowersModal = ({ isOpen, onClose, username, type }: FollowersModalProps) => {
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['userConnections', username, type],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        // Update the API call to use /api prefix
        const { data } = await api.get(`/api/${username}/${type}?page=${pageParam}`);
        return data;
      } catch (err) {
        console.error('Error fetching connections:', err);
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
    enabled: !!currentUser,
  });

  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: number; isFollowing: boolean }) => {
      const url = `/api/follow/${userId}`;  // Update URL to include /api prefix
      return isFollowing ? api.delete(url) : api.post(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userConnections', username, type] });
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      console.error('Follow mutation error:', error);
    }
  });

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const allUsers = data?.pages.flatMap(page => page.users) || [];

  const handleFollowClick = (user: User) => {
    if (user.isFollowing !== undefined) {
      followMutation.mutate({ userId: user.id, isFollowing: user.isFollowing });
    }
  };

  // Handle login redirect
  const handleLoginClick = () => {
    onClose(); // Close the modal
    router.push('/login'); // Redirect to login page
  };

  if (isLoadingUser) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-md">
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Lock className="h-12 w-12 text-gray-400" />
            <p className="text-center text-gray-600">
              Please log in to view {type === 'followers' ? 'followers' : 'following'} list
            </p>
            <Button onClick={handleLoginClick}>
              Log In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {status === 'pending' ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : status === 'error' ? (
            <div className="text-center py-4 text-red-600">
              Error loading users: {(error as Error)?.message || 'Unknown error'}
            </div>
          ) : (
            <div className="space-y-2">
              {allUsers.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    className="font-medium hover:text-blue-600 transition-colors"
                  >
                    {user.username}
                  </Link>
                  {user.isFollowing !== undefined && user.id !== currentUser?.userId && (
                    <Button
                      variant={user.isFollowing ? "outline" : "default"}
                      size="sm"
                      className="ml-2"
                      onClick={() => handleFollowClick(user)}
                      disabled={followMutation.isPending}
                    >
                      {user.isFollowing ? (
                        <><UserCheck className="h-4 w-4 mr-1" /> Following</>
                      ) : (
                        <><UserPlus className="h-4 w-4 mr-1" /> Follow</>
                      )}
                    </Button>
                  )}
                </div>
              ))}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              <div ref={ref} className="h-4" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;