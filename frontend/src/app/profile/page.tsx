'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Pencil } from "lucide-react";
import Link from 'next/link';
import SettingsModal from '@/components/profile/SettingsModal';
import FollowersModal from '@/components/profile/FollowersModal';
import { InfiniteScrollTrigger } from '@/components/InfiniteScrollTrigger';
import axios from 'axios';
import ShareProfileButton from '@/components/ShareProfileButton';
import ProfileSkeleton from '@/components/ProfileSkeleton';

// Interfaces
interface UserProfile {
  username: string;
  reputation: number;
  acceptsEmails: boolean;
  bio: string | null;
  followers: { id: number }[];
  following: { id: number }[];
  email: string;
}

interface Thread {
  id: number;
  title: string;
  content: string;
  vote_count: number;
  created_at: string;
}

interface ThreadBookmark {
  id: number;
  title: string;
  content: string;
  username: string;
  bookmarked_at: string;
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

const api = axios.create({
  withCredentials: true
});

const MyProfile = () => {
  const queryClient = useQueryClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Queries and Mutations
  const { 
    data: user,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/api/auth/profile');
      return data;
    },
    refetchOnMount: 'always'
  });

  const { 
    data: overviewData,
    isLoading: isLoadingOverview,
  } = useQuery<OverviewResponse>({
    queryKey: ['profile', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/api/auth/profile/overview');
      return data;
    },
    enabled: activeTab === 'overview'
  });

  const {
    data: threadsData,
    fetchNextPage: fetchNextThreads,
    hasNextPage: hasMoreThreads,
    isFetchingNextPage: isFetchingNextThreads,
    isLoading: isLoadingThreads
  } = useInfiniteQuery<PaginatedResponse<Thread>>({
    queryKey: ['userThreads'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PaginatedResponse<Thread>>(
        `/api/user/threads?page=${pageParam}`
      );
      return data;
    },
    getNextPageParam: (lastPage) => 
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    enabled: activeTab === 'threads' // Only fetch when threads tab is active
  });

  const {
    data: repliesData,
    fetchNextPage: fetchNextReplies,
    hasNextPage: hasMoreReplies,
    isFetchingNextPage: isFetchingNextReplies,
    isLoading: isLoadingReplies
  } = useInfiniteQuery<PaginatedResponse<Reply>>({
    queryKey: ['userReplies'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PaginatedResponse<Reply>>(
        `/api/user/replies?page=${pageParam}`
      );
      return data;
    },
    getNextPageParam: (lastPage) => 
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    enabled: activeTab === 'replies'
  });

  const {
    data: reviewsData,
    fetchNextPage: fetchNextReviews,
    hasNextPage: hasMoreReviews,
    isFetchingNextPage: isFetchingNextReviews,
    isLoading: isLoadingReviews
  } = useInfiniteQuery<PaginatedResponse<Review>>({
    queryKey: ['userReviews'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PaginatedResponse<Review>>(
        `/api/user/reviews?page=${pageParam}`
      );
      return data;
    },
    getNextPageParam: (lastPage) => 
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    enabled: activeTab === 'reviews'
  });

  const {
    data: bookmarksData,
    fetchNextPage: fetchNextBookmarks,
    hasNextPage: hasMoreBookmarks,
    isFetchingNextPage: isFetchingNextBookmarks,
    isLoading: isLoadingBookmarks
  } = useInfiniteQuery<PaginatedResponse<Bookmark>>({
    queryKey: ['userBookmarks'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PaginatedResponse<Bookmark>>(
        `/api/user/bookmarks?page=${pageParam}`
      );
      return data;
    },
    getNextPageParam: (lastPage) => 
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    enabled: activeTab === 'bookmarks'
  });

  const {
    data: threadBookmarksData,
    fetchNextPage: fetchNextThreadBookmarks,
    hasNextPage: hasMoreThreadBookmarks,
    isFetchingNextPage: isFetchingNextThreadBookmarks,
    isLoading: isLoadingThreadBookmarks
  } = useInfiniteQuery<PaginatedResponse<ThreadBookmark>>({
    queryKey: ['userThreadBookmarks'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PaginatedResponse<ThreadBookmark>>(
        `/api/thread-bookmarks/user?page=${pageParam}`
      );
      return data;
    },
    getNextPageParam: (lastPage) => 
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    enabled: activeTab === 'bookmarks'
  });

  const updateBioMutation = useMutation<any, Error, string>({
    mutationFn: async (bio: string) => {
      console.log('1. Starting mutation with bio:', bio);
      const { data } = await api.patch('/api/auth/update-bio', { bio });
      console.log('2. API Response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('3. Mutation success, updating query data directly');
      queryClient.setQueryData(['profile'], (old: any) => ({
        ...old,
        bio: data.bio
      }));
      console.log('4. Setting isEditingBio to false');
      setIsEditingBio(false);
    }
  });

  // Data Processing
  const threads = threadsData?.pages.flatMap((page) => page.threads || []) ?? [];
  const replies = repliesData?.pages.flatMap((page) => page.replies || []) ?? [];
  const reviews = reviewsData?.pages.flatMap((page) => page.reviews || []) ?? [];
  const bookmarks = bookmarksData?.pages.flatMap((page) => page.bookmarks || []) ?? [];
  const threadBookmarks = threadBookmarksData?.pages.flatMap((page) => page.threads || []) ?? [];

  useEffect(() => {
    if (user?.bio !== undefined) {
      setBioInput(user?.bio || '');
    }
  }, [user?.bio]);

  if (isLoadingProfile) {
    return <ProfileSkeleton />;
  }

  if (isProfileError) {
    return (
      <div className="text-center p-10 text-red-600">
        {(profileError as Error)?.message || 'Failed to load profile'}
      </div>
    );
  }
  
  console.log('5. Rendering component with user bio:', user?.bio);
  
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
  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user?.username}</h1>
    <ShareProfileButton username={user?.username} />
  </div>
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setIsSettingsOpen(true)}
    className="sm:hidden"
  >
    <Settings className="h-5 w-5" />
  </Button>
</div>
                  
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>
                      Reputation: {user?.reputation}
                    </span>
                    <button
                      onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {user?.followers?.length || 0} Followers
                    </button>
                    <button
                      onClick={() => setFollowModal({ isOpen: true, type: 'following' })}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {user?.following?.length || 0} Following
                    </button>
                  </div>

                  <div className="mt-3 sm:mt-4">
  <div className="relative flex flex-col">
    <div className="flex-1 min-w-0">  {/* Parent container */}
      {!isEditingBio ? (
        <div className="flex items-start space-x-2">  {/* Bio container */}
          <div className="flex-1 min-w-0 overflow-hidden">  {/* Added text wrapper */}
            <p className="min-w-0 text-sm sm:text-base text-gray-600 whitespace-normal break-words overflow-hidden">
              {user?.bio || 'No bio yet'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingBio(true)}
            className="shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ) : (
                        <div className="w-full space-y-1.5 sm:space-y-2">
                          <Textarea
                            value={bioInput}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioInput(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="resize-none w-full"
                            maxLength={140}
                            rows={3}
                          />
                          <div className="flex items-center justify-between">
                            <div className="space-x-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (bioInput.trim() !== user?.bio) {
                                    updateBioMutation.mutate(bioInput.trim());
                                  } else {
                                    setIsEditingBio(false);
                                  }
                                }}
                                disabled={
                                  updateBioMutation.isPending ||
                                  bioInput.trim() === user?.bio ||
                                  bioInput.trim().length > 140 ||
                                  bioInput.trim().length === 0
                                }
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsEditingBio(false);
                                  setBioInput(user?.bio || '');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                            <span className="text-sm text-gray-500">
                              {bioInput.length}/140
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
    {/* Only show error message */}
    <div className="absolute top-full left-0 right-0 mt-2">
      {updateBioMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to update bio. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  </div>
</div>
                </div>
              </div>

              {/* Desktop Settings Button */}
              <div className="hidden sm:block">
                <Button
                  variant="outline"
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
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
      My Humidor
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
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">Total Threads</span>
                <span className="font-medium">
                  {overviewData?.stats.totalThreads || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">Total Reviews</span>
                <span className="font-medium">
                  {overviewData?.stats.totalReviews || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">Total Replies</span>
                <span className="font-medium">
                  {overviewData?.stats.totalReplies || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
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
                            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">{thread.content}</p>
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
                          <div key={reply.id} className="mb-3 sm:mb-4 p-3 sm:p-4 border-b last:border-0">
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
                          <div key={review.id} className="mb-3 sm:mb-4 p-3 sm:p-4 border-b last:border-0">
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
                    <CardTitle>My Humidor</CardTitle>
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
                              <div key={bookmark.Bookmark.id} className="mb-3 sm:mb-4 p-3 sm:p-4 border-b last:border-0">
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
                            No cigars in your humidor yet
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="threads">
                        {isLoadingThreadBookmarks ? (
                          <div className="text-center py-6 text-gray-500">Loading...</div>
                        ) : threadBookmarks.length > 0 ? (
                          <>
                            {threadBookmarks.map((bookmark) => (
                              <div key={bookmark.id} className="mb-3 sm:mb-4 p-3 sm:p-4 border-b last:border-0">
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
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentEmailPreference={user?.acceptsEmails ?? false}
      />

      {followModal && (
        <FollowersModal
          isOpen={followModal.isOpen}
          onClose={() => setFollowModal(null)}
          username={user?.username || ''}
          type={followModal.type}
        />
      )}
    </div>
  );
};

export default MyProfile;