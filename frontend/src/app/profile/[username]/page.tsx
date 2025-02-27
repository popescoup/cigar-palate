'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import Link from 'next/link';
import axios from 'axios';
import FollowersModal from '@/components/profile/FollowersModal';
import { InfiniteScrollTrigger } from '@/components/InfiniteScrollTrigger';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import ShareProfileButton from '@/components/ShareProfileButton';
import { api } from '@/utils/axiosConfig';
import ProfileSkeleton from '@/components/ProfileSkeleton';

interface UserProfile {
  id: number;
  username: string;
  reputation: number;
  bio: string | null;
  created_at: string;
  followers: { id: number }[];
  following: { id: number }[];
  isFollowing: boolean;
}

interface Thread {
  id: number;
  title: string;
  content: string;
  vote_count: number;
  created_at: string;
  user: {
    username: string;
  };
}

interface Reply {
  id: number;
  content: string;
  thread_id: number;
  vote_count: number;
  created_at: string;
  thread: {
    id: number;
    title: string;
  };
  user: {
    username: string;
  };
}

interface Review {
  id: number;
  comment: string;
  vote_count: number;
  created_at: string;
  cigar: {
    id: number;
    name: string;
    brand?: {
      name: string;
    };
  };
  user: {
    username: string;
  };
}

interface Bookmark {
  id: number;
  name: string;
  brand: {
    name: string;
  };
  Bookmark: {
    created_at: string;
    id: number;
  };
}

interface ThreadBookmark {
  id: number;
  title: string;
  content: string;
  username: string;
  bookmarked_at: string;
}

interface PaginatedResponse<T> {
  currentPage: number;
  totalPages: number;
  threads?: T[];
  replies?: T[];
  reviews?: T[];
  bookmarks?: T[];
  totalThreads?: number;
  totalReplies?: number;
  totalReviews?: number;
  totalBookmarks?: number;
  totalThreadBookmarks?: number;
}

interface OverviewResponse {
  recentActivity: (Thread | Review | Reply)[];
  stats: {
    totalThreads: number;
    totalReviews: number;
    totalReplies: number;
    totalBookmarks: number;
    totalThreadBookmarks: number;
  };
}

const ProfilePage = ({ params }: { params: { username: string } }) => {
  const router = useRouter();
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoadingUser && currentUser?.username === params.username && !isRedirecting) {
      setIsRedirecting(true);
      router.replace('/profile');
    }
  }, [currentUser?.username, isLoadingUser, params.username, router, isRedirecting]);

  // Skip all queries if we're redirecting
  const shouldFetchData = !isRedirecting && !isLoadingUser;

// Fetch user profile
const { 
  data: user,
  isLoading: isLoadingProfile,
  isError: isProfileError 
} = useQuery<UserProfile>({
  queryKey: ['profile', params.username],
  // Update this to use just the route path
  queryFn: () => api.get(`/api/profile/${params.username}`).then(res => res.data),
  refetchOnMount: 'always',
  enabled: shouldFetchData
});

const { 
  data: overviewData,
  isLoading: isLoadingOverview,
} = useQuery<OverviewResponse>({
  queryKey: ['profile', params.username, 'overview'],
  queryFn: async () => {
    const { data } = await api.get(`/api/user/${params.username}/overview`);
    return data;
  },
  enabled: shouldFetchData && activeTab === 'overview'
});

// Infinite Queries
const {
  data: threadsData,
  fetchNextPage: fetchNextThreads,
  hasNextPage: hasMoreThreads,
  isFetchingNextPage: isFetchingNextThreads,
  isLoading: isLoadingThreads
} = useInfiniteQuery<PaginatedResponse<Thread>>({
  queryKey: ['userThreads', params.username],
  initialPageParam: 1,
  queryFn: async ({ pageParam }) => {
    const { data } = await api.get<PaginatedResponse<Thread>>(
      `/api/user/${params.username}/threads?page=${pageParam}`
    );
    return data;
  },
  getNextPageParam: (lastPage) => 
    lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  enabled: shouldFetchData && activeTab === 'threads'
});

const {
  data: repliesData,
  fetchNextPage: fetchNextReplies,
  hasNextPage: hasMoreReplies,
  isFetchingNextPage: isFetchingNextReplies,
  isLoading: isLoadingReplies
} = useInfiniteQuery<PaginatedResponse<Reply>>({
  queryKey: ['userReplies', params.username],
  initialPageParam: 1,
  queryFn: async ({ pageParam }) => {
    const { data } = await api.get<PaginatedResponse<Reply>>(
      `/api/user/${params.username}/replies?page=${pageParam}`
    );
    return data;
  },
  getNextPageParam: (lastPage) => 
    lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  enabled: shouldFetchData && activeTab === 'replies'
});

const {
  data: reviewsData,
  fetchNextPage: fetchNextReviews,
  hasNextPage: hasMoreReviews,
  isFetchingNextPage: isFetchingNextReviews,
  isLoading: isLoadingReviews
} = useInfiniteQuery<PaginatedResponse<Review>>({
  queryKey: ['userReviews', params.username],
  initialPageParam: 1,
  queryFn: async ({ pageParam }) => {
    const { data } = await api.get<PaginatedResponse<Review>>(
      `/api/user/${params.username}/reviews?page=${pageParam}`
    );
    return data;
  },
  getNextPageParam: (lastPage) => 
    lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  enabled: shouldFetchData && activeTab === 'reviews'
});

const {
  data: bookmarksData,
  fetchNextPage: fetchNextBookmarks,
  hasNextPage: hasMoreBookmarks,
  isFetchingNextPage: isFetchingNextBookmarks,
  isLoading: isLoadingBookmarks
} = useInfiniteQuery<PaginatedResponse<Bookmark>>({
  queryKey: ['userBookmarks', params.username],
  initialPageParam: 1,
  queryFn: async ({ pageParam }) => {
    const { data } = await api.get<PaginatedResponse<Bookmark>>(
      `/api/user/${params.username}/bookmarks?page=${pageParam}`
    );
    return data;
  },
  getNextPageParam: (lastPage) => 
    lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  enabled: shouldFetchData && activeTab === 'bookmarks'
});

const {
  data: threadBookmarksData,
  fetchNextPage: fetchNextThreadBookmarks,
  hasNextPage: hasMoreThreadBookmarks,
  isFetchingNextPage: isFetchingNextThreadBookmarks,
  isLoading: isLoadingThreadBookmarks
} = useInfiniteQuery<PaginatedResponse<ThreadBookmark>>({
  queryKey: ['userThreadBookmarks', params.username],
  initialPageParam: 1,
  queryFn: async ({ pageParam }) => {
    const { data } = await api.get<PaginatedResponse<ThreadBookmark>>(
      `/api/user/${params.username}/thread-bookmarks?page=${pageParam}`
    );
    return data;
  },
  getNextPageParam: (lastPage) => 
    lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
  enabled: shouldFetchData && activeTab === 'bookmarks'
});

// Follow/Unfollow mutation
const followMutation = useMutation({
  mutationFn: (isFollowing: boolean) => {
    const url = `/api/follow/${user?.id}`;
    return isFollowing ? api.delete(url) : api.post(url);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile', params.username] });
    queryClient.invalidateQueries({ queryKey: ['userConnections'] });
  },
  onError: (error) => {
    console.error('Follow mutation error:', error);
  }
});

// Data Processing
const threads = threadsData?.pages.flatMap((page) => page.threads || []) ?? [];
const replies = repliesData?.pages.flatMap((page) => page.replies || []) ?? [];
const reviews = reviewsData?.pages.flatMap((page) => page.reviews || []) ?? [];
const bookmarks = bookmarksData?.pages.flatMap((page) => page.bookmarks || []) ?? [];
const threadBookmarks = threadBookmarksData?.pages.flatMap((page) => page.threads || []) ?? [];

if (isLoadingProfile) {
  return <ProfileSkeleton />;
}

if (isProfileError || !user) {
  return <div className="text-center p-10 text-red-600">User not found</div>;
}

return (
  <div className="w-full min-h-screen bg-gray-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex">
              {/* Profile Info */}
              <div className="flex-1">
              <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
  <div className="flex items-center gap-2">
  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.username}</h1>
    <ShareProfileButton username={user.username} />
  </div>
</div>
                
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>
                    Reputation: {user.reputation}
                  </span>
                  <button
                    onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {user.followers.length || 0} Followers
                  </button>
                  <button
                    onClick={() => setFollowModal({ isOpen: true, type: 'following' })}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {user.following.length || 0} Following
                  </button>
                </div>

                <div className="mt-4 relative">
                  <div className="flex items-start justify-between">
                  <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap break-words min-w-0 flex-1 break-words">
                      {user.bio || 'No bio yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

{/* Follow/Unfollow Button */}
{user.isFollowing !== undefined && currentUser?.username !== params.username && (
  <div className="mt-4 sm:mt-0">
    {currentUser ? (
      <Button
        onClick={() => followMutation.mutate(user.isFollowing!)}
        disabled={followMutation.isPending}
        variant={user.isFollowing ? "outline" : "default"}
        className="w-full sm:w-auto"
      >
        {user.isFollowing ? (
          <><UserMinus className="mr-2 h-4 w-4" /> Unfollow</>
        ) : (
          <><UserPlus className="mr-2 h-4 w-4" /> Follow</>
        )}
      </Button>
    ) : (
      <Button
        onClick={() => router.push('/login')}
        variant="outline"
        className="w-full sm:w-auto"
      >
        <UserPlus className="mr-2 h-4 w-4" /> Login to Follow
      </Button>
    )}
  </div>
)}
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full block">
  <TabsList className="w-full border-t grid grid-cols-3 sm:flex sm:justify-start p-2 sm:p-0 gap-2 sm:gap-0 relative bg-white sm:bg-gray-50">
    <TabsTrigger 
      className="text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 h-9 sm:h-auto bg-gray-50 sm:bg-transparent hover:bg-gray-100 sm:hover:bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm" 
      value="overview"
    >
      Overview
    </TabsTrigger>
    <TabsTrigger 
      className="text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 h-9 sm:h-auto bg-gray-50 sm:bg-transparent hover:bg-gray-100 sm:hover:bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm" 
      value="threads"
    >
      Threads
    </TabsTrigger>
    <TabsTrigger 
      className="text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 h-9 sm:h-auto bg-gray-50 sm:bg-transparent hover:bg-gray-100 sm:hover:bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm" 
      value="replies"
    >
      Replies
    </TabsTrigger>
    <TabsTrigger 
      className="text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 h-9 sm:h-auto bg-gray-50 sm:bg-transparent hover:bg-gray-100 sm:hover:bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm" 
      value="reviews"
    >
      Reviews
    </TabsTrigger>
    <TabsTrigger 
      className="text-xs sm:text-base whitespace-nowrap px-2 sm:px-4 h-9 sm:h-auto bg-gray-50 sm:bg-transparent hover:bg-gray-100 sm:hover:bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm col-span-2" 
      value="bookmarks"
    >
      Humidor
    </TabsTrigger>
  </TabsList>

  <div className="mt-20 sm:mt-6">
  <TabsContent value="overview" className="mt-0">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-2 space-y-6 order-2 md:order-1">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOverview ? (
            <div className="text-center py-6 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              {overviewData?.recentActivity.map((item) => {
                const isThread = 'title' in item && !('thread' in item);
                const isReview = 'comment' in item;
                const isReply = 'thread' in item;

                return (
                  <div key={item.id} className="mb-3 sm:mb-4 border-b last:border-0 pb-3 sm:pb-4">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm text-blue-600 mb-1">
                        {isThread ? 'Created a new thread' :
                         isReview ? 'Posted a cigar review' :
                         'Replied to thread'}
                      </span>
                      <Link 
                        href={isThread ? `/forum/thread/${item.id}` :
                              isReview ? `/cigars/${(item as Review).cigar.id}?highlight=${item.id}` :
                              `/forum/thread/${(item as Reply).thread.id}?highlight=${item.id}`}
                        className="text-xs sm:text-sm text-gray-900 hover:text-blue-600"
                      >
                        {isThread ? (item as Thread).title :
                         isReview ? `${(item as Review).cigar.name}${(item as Review).cigar?.brand?.name ? ` - ${(item as Review).cigar?.brand?.name}` : ''}` :
                         (item as Reply).thread.title}
                      </Link>
                      {isReply && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {(item as Reply).content}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <div className="space-y-6 order-1 md:order-2">
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingOverview ? (
            <div className="text-center py-6 text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Threads</span>
                <span className="font-medium">
                  {overviewData?.stats.totalThreads || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Reviews</span>
                <span className="font-medium">
                  {overviewData?.stats.totalReviews || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Replies</span>
                <span className="font-medium">
                  {overviewData?.stats.totalReplies || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Items in Humidor</span>
                <span className="font-medium">
                  {(overviewData?.stats.totalBookmarks || 0) + 
                   (overviewData?.stats.totalThreadBookmarks || 0)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
</TabsContent>

              <TabsContent value="threads" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Forum Threads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingThreads ? (
                      <div className="text-center py-6 text-gray-500">Loading...</div>
                    ) : threads.length > 0 ? (
                      <>
                        {threads.map((thread) => (
                          <div key={thread.id} className="mb-3 sm:mb-4 p-3 sm:p-4 border-b last:border-0">
                            <Link 
                              href={`/forum/thread/${thread.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                             <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">{thread.title}</h3>
                            </Link>
                            <p className="text-gray-600 line-clamp-2">{thread.content}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>Votes: {thread.vote_count}</span>
                              <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        <InfiniteScrollTrigger
                          onIntersect={fetchNextThreads}
                          hasMore={hasMoreThreads}
                          isLoading={isFetchingNextThreads}
                        />
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No threads yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="replies" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Forum Replies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingReplies ? (
                      <div className="text-center py-6 text-gray-500">Loading...</div>
                    ) : replies.length > 0 ? (
                      <>
                        {replies.map((reply) => (
                          <div key={reply.id} className="mb-4 p-4 border-b last:border-0">
                            <Link 
  href={`/forum/thread/${reply.thread.id}?highlight=${reply.id}`}
  className="hover:text-blue-600 transition-colors block"
>
                              <p className="font-semibold mb-1 text-gray-800">
                                {reply.thread.title}
                              </p>
                              <p className="text-gray-600">{reply.content}</p>
                            </Link>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>Votes: {reply.vote_count}</span>
                              <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        <InfiniteScrollTrigger
                          onIntersect={fetchNextReplies}
                          hasMore={hasMoreReplies}
                          isLoading={isFetchingNextReplies}
                        />
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No replies yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Cigar Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingReviews ? (
                      <div className="text-center py-6 text-gray-500">Loading...</div>
                    ) : reviews.length > 0 ? (
                      <>
                        {reviews.map((review) => (
                          <div key={review.id} className="mb-4 p-4 border-b last:border-0">
                            <Link 
  href={`/cigars/${review.cigar.id}?highlight=${review.id}`}
  className="hover:text-blue-600 transition-colors block"
>
                              <p className="font-semibold mb-1 text-gray-800">{review.cigar.name}</p>
                              <p className="text-sm text-gray-500 mb-2">{review.cigar.brand?.name}</p>
                              <p className="text-gray-600">{review.comment}</p>
                            </Link>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>Votes: {review.vote_count}</span>
                              <span>{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        <InfiniteScrollTrigger
                          onIntersect={fetchNextReviews}
                          hasMore={hasMoreReviews}
                          isLoading={isFetchingNextReviews}
                        />
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No reviews yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookmarks" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Humidor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="cigars" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-3 sm:mb-4 h-9 sm:h-10 p-1">
  <TabsTrigger className="text-sm sm:text-base h-7 sm:h-8" value="cigars">Collection</TabsTrigger>
  <TabsTrigger className="text-sm sm:text-base h-7 sm:h-8" value="threads">Saved Threads</TabsTrigger>
</TabsList>

                      <TabsContent value="cigars">
                        {isLoadingBookmarks ? (
                          <div className="text-center py-6 text-gray-500">Loading...</div>
                        ) : bookmarks.length > 0 ? (
                          <>
                            {bookmarks.map((bookmark) => (
                              <div key={bookmark.Bookmark.id} className="mb-4 p-4 border-b last:border-0">
                                <Link 
                                  href={`/cigars/${bookmark.id}`}
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  <p className="font-semibold text-gray-800">{bookmark.name}</p>
                                </Link>
                                <p className="text-sm text-gray-500">{bookmark.brand.name}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Bookmarked {new Date(bookmark.Bookmark.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                            <InfiniteScrollTrigger
                              onIntersect={fetchNextBookmarks}
                              hasMore={hasMoreBookmarks}
                              isLoading={isFetchingNextBookmarks}
                            />
                          </>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            No cigars in humidor yet
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="threads">
                        {isLoadingThreadBookmarks ? (
                          <div className="text-center py-6 text-gray-500">Loading...</div>
                        ) : threadBookmarks.length > 0 ? (
                          <>
                            {threadBookmarks.map((bookmark) => (
                              <div key={bookmark.id} className="mb-4 p-4 border-b last:border-0">
                                <Link 
                                  href={`/forum/thread/${bookmark.id}`}
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  <p className="font-semibold text-gray-800">{bookmark.title}</p>
                                </Link>
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                  {bookmark.content}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-sm text-gray-500">
                                    Posted by {bookmark.username}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Bookmarked {new Date(bookmark.bookmarked_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <InfiniteScrollTrigger
                              onIntersect={fetchNextThreadBookmarks}
                              hasMore={hasMoreThreadBookmarks}
                              isLoading={isFetchingNextThreadBookmarks}
                            />
                          </>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            No saved threads yet
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {followModal && (
        <FollowersModal
          isOpen={followModal.isOpen}
          onClose={() => setFollowModal(null)}
          username={user.username}
          type={followModal.type}
        />
      )}
    </div>
  );
};

export default ProfilePage;