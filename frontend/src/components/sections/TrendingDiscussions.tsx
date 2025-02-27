'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ThumbsUp, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Thread {
  id: number;
  title: string;
  content: string;
  vote_count: number;
  reply_count: number;
  likes: number;
  user: {
    username: string;
  };
}

const TrendingDiscussions = () => {
  const { data: threads, isLoading } = useQuery({
    queryKey: ['trendingThreads'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/threads/trending`);
      if (!response.ok) throw new Error('Failed to fetch trending threads');
      const data = await response.json();
      return data.slice(0, 3); // Only take top 3 threads
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="bg-white py-8 sm:py-12 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 sm:text-4xl mb-3 sm:mb-4">
            Join The Conversation
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            See what discussions have been trending in our forum
          </p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {threads?.map((thread: Thread) => (
            <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
              <Card className="p-4 sm:p-6 h-full hover:shadow-lg transition-shadow duration-200">
                <h3 className="font-medium text-base sm:text-lg text-gray-900 mb-2 line-clamp-2">
                  {thread.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 line-clamp-2">
                  {thread.content.replace(/<[^>]*>/g, '')}
                </p>
                <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-auto">
                  <div className="flex items-center mr-3 sm:mr-4">
                    <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {thread.likes}
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {thread.reply_count}
                  </div>
                  <div className="ml-auto text-xs sm:text-sm text-gray-400">
                    by {thread.user.username}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
  
        <div className="text-center">
          <Button 
            variant="outline"
            className="group w-full sm:w-auto"
            asChild
          >
            <Link href="/forum">
              View All Discussions
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrendingDiscussions;