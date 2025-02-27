'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Thread } from '@/types/forum';
import { formatDistanceToNow } from 'date-fns';
import VoteButtons from './VoteButtons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import BookmarkButton from '@/components/BookmarkButton';

interface ThreadsListProps {
    threads: Thread[];
}

const ThreadsList: React.FC<ThreadsListProps> = ({ threads: initialThreads }) => {
    const [threads, setThreads] = useState<Thread[]>(initialThreads);
    const { currentUser, isLoading: isLoadingUser } = useCurrentUser();

    // Debug effect for thread updates
    useEffect(() => {
        console.log('ThreadsList received new threads:', 
          initialThreads.map(t => ({
            id: t.id,
            vote_count: t.vote_count,
            likes: t.likes,
            dislikes: t.dislikes
          }))
        );
        setThreads(initialThreads);
    }, [initialThreads]);

    const handleVote = async (threadId: number, voteType: 'like' | 'dislike') => {
        try {
            console.log('Voting on thread:', { threadId, voteType });
            
            const response = await fetch(`/api/threads/${threadId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ voteType }),
            });
            

            if (!response.ok) {
                throw new Error('Failed to vote');
            }

            const data = await response.json();
            console.log('Vote response:', data);

            setThreads(prev =>
                prev.map(thread =>
                    thread.id === threadId
                        ? {
                            ...thread,
                            likes: data.likes,
                            dislikes: data.dislikes,
                            vote_count: data.vote_count,
                            userVote: data.userVote
                        }
                        : thread
                )
            );
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    if (isLoadingUser) {
        return <div className="text-center py-4">Loading...</div>;
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            {threads.map((thread) => (
                <div 
                    key={thread.id} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-3 sm:p-4"
                >
                    <div className="flex items-start justify-between mb-3">
  <Link 
    href={`/forum/thread/${thread.id}`}
    className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors block"
  >
    {thread.title}
  </Link>
  <div className="flex items-center space-x-4">
  <BookmarkButton
  threadId={thread.id}
  initialBookmarkCount={thread.total_bookmarks || 0}
  size="small"
  showCount={false}  // Hide count in list view
  isLoggedIn={!!currentUser}
/>
    <VoteButtons
      initialLikes={thread.likes}
      initialDislikes={thread.dislikes}
      initialUserVote={thread.userVote}
      onVote={(voteType) => handleVote(thread.id, voteType)}
      size="small"
      isLoggedIn={!!currentUser}
    />
  </div>
</div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                        {thread.tags.map((tag) => (
                            <Link 
                                key={tag.id}
                                href={`/forum/tag/${encodeURIComponent(tag.name)}`}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
                            >
                                {tag.name}
                            </Link>
                        ))}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                        {thread.content}
                    </p>

                    <div className="text-sm text-gray-500 flex justify-between items-center">
                    <span>
  Posted by {thread.user.username} • {new Date(thread.created_at).toLocaleDateString()}
</span>
                        <span className="flex items-center gap-2">
                            {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                        </span>
                    </div>
                </div>
            ))}
            
            {threads.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
                    No threads found. Be the first to create one!
                </div>
            )}
        </div>
    );
};

export default ThreadsList;