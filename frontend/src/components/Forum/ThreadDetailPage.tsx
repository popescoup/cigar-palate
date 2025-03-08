// src/components/Forum/ThreadDetailPage.tsx

'use client'

import React, { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Thread, Reply, CreateThreadData } from '@/types/forum';
import CreateReplyForm from './CreateReplyForm';
import { formatDistanceToNow } from 'date-fns';
import VoteButtons from './VoteButtons';
import SortControl, { SortOption } from './SortControl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateThreadModal from './CreateThreadModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Image from 'next/image';
import Username from '@/components/Username';
import BookmarkButton from '@/components/BookmarkButton';
import { Loader2 } from 'lucide-react';
import OPBadge from './OPBadge';
import { useSearchParams } from 'next/navigation';
import { getImageUrl } from '@/utils/imageUtils';

interface ThreadDetailPageProps {
    threadId: number;
}

// API functions
const fetchThread = async (threadId: number): Promise<Thread> => {
    const { data } = await axios.get(
        `/api/threads/${threadId}`,
        { withCredentials: true }
    );
    return data;
};

const ThreadDetailPage: React.FC<ThreadDetailPageProps> = ({ threadId }) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
    const [sortOption, setSortOption] = React.useState<SortOption>('newest');
    const [replyingTo, setReplyingTo] = React.useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingReplyId, setEditingReplyId] = React.useState<number | null>(null);
    const [imageError, setImageError] = React.useState(false);
    const [deletingThreadId, setDeletingThreadId] = React.useState<number | null>(null);
    const [deletingReplyId, setDeletingReplyId] = React.useState<number | null>(null);
    const searchParams = useSearchParams();
    const highlightedReplyId = searchParams.get('highlight');
    const highlightedReplyRef = useRef<HTMLDivElement>(null);

    // Query for thread data
    const { 
        data: thread,
        isLoading,
        isError,
        error,
        refetch: refetchThread
    } = useQuery({
        queryKey: ['thread', threadId],
        queryFn: () => fetchThread(threadId),
    });

    // Mutations
    const threadVoteMutation = useMutation({
        mutationFn: async ({ voteType }: { voteType: 'like' | 'dislike' }) => {
            const { data } = await axios.post(
                `/api/threads/${threadId}/vote`,
                { voteType },
                { withCredentials: true }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
        }
    });

    const deleteThreadMutation = useMutation({
        mutationFn: async () => {
            await axios.delete(
                `/api/threads/${threadId}`,
                { withCredentials: true }
            );
        },
        onSuccess: () => {
            router.push('/forum');
        }
    });

    const editThreadMutation = useMutation({
        mutationFn: async (data: CreateThreadData | FormData) => {
            const formData = data instanceof FormData ? data : (() => {
                const fd = new FormData();
                fd.append('title', data.title);
                fd.append('content', data.content);
                fd.append('tags', JSON.stringify(data.tags));
                return fd;
            })();

            const { data: responseData } = await axios.put(
                `/api/threads/${threadId}`,
                formData,
                { withCredentials: true }
            );
            return responseData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
            setIsEditModalOpen(false);
        }
    });

    const replyVoteMutation = useMutation({
        mutationFn: async ({ replyId, voteType }: { replyId: number; voteType: 'like' | 'dislike' }) => {
            const { data } = await axios.post(
                `/api/replies/${replyId}/vote`,
                { voteType },
                { withCredentials: true }
            );
            return { replyId, data };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
        }
    });

    const deleteReplyMutation = useMutation({
        mutationFn: async (replyId: number) => {
            await axios.delete(
                `/api/replies/${replyId}`,
                { withCredentials: true }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
        }
    });

    const editReplyMutation = useMutation({
        mutationFn: async ({ replyId, content }: { replyId: number; content: string }) => {
            const { data } = await axios.put(
                `/api/replies/${replyId}`,
                { content },
                { 
                    withCredentials: true,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
            setEditingReplyId(null);
        }
    });

    useEffect(() => {
        // Only attempt to scroll if we have both the ID and the thread data
        if (highlightedReplyId && thread && !isLoading) {
            // Increase timeout to ensure content is rendered
            setTimeout(() => {
                if (highlightedReplyRef.current) {
                    highlightedReplyRef.current.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }, 300);
        }
    }, [highlightedReplyId, thread, isLoading]);

    // Handlers
    const handleThreadVote = async (voteType: 'like' | 'dislike') => {
        try {
            await threadVoteMutation.mutateAsync({ voteType });
        } catch (error) {
            console.error('Error voting on thread:', error);
        }
    };

    const handleDeleteThread = async () => {
        if (!thread) return;
        try {
            await deleteThreadMutation.mutateAsync();
        } catch (error) {
            console.error('Error deleting thread:', error);
        }
    };

    const handleEditThread = async (data: CreateThreadData | FormData) => {
        try {
            await editThreadMutation.mutateAsync(data);
        } catch (error) {
            console.error('Error updating thread:', error);
        }
    };

    const handleReplyVote = async (replyId: number, voteType: 'like' | 'dislike') => {
        try {
            await replyVoteMutation.mutateAsync({ replyId, voteType });
        } catch (error) {
            console.error('Error voting on reply:', error);
        }
    };

    const handleDeleteReply = async (replyId: number) => {
        try {
            await deleteReplyMutation.mutateAsync(replyId);
        } catch (error) {
            console.error('Error deleting reply:', error);
        }
    };

    const handleEditReply = async (replyId: number, content: string) => {
        try {
            await editReplyMutation.mutateAsync({ replyId, content });
        } catch (error) {
            console.error('Error updating reply:', error);
        }
    };

    const handleReplyCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
        setReplyingTo(null);
    };

    const getSortedReplies = () => {
        if (!thread?.replies) return [];
        
        const sortReplies = (replies: Reply[]): Reply[] => {
            const sorted = [...replies].sort((a, b) => {
                switch (sortOption) {
                    case 'newest':
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    case 'most-liked':
                        if (a.is_deleted && !b.is_deleted) return 1;
                        if (!a.is_deleted && b.is_deleted) return -1;
                        return b.vote_count - a.vote_count;
                    case 'most-disliked':
                        if (a.is_deleted && !b.is_deleted) return 1;
                        if (!a.is_deleted && b.is_deleted) return -1;
                        return a.vote_count - b.vote_count;
                    default:
                        return 0;
                }
            });

            return sorted.map(reply => ({
                ...reply,
                children: reply.children ? sortReplies(reply.children) : undefined
            }));
        };

        return sortReplies(thread.replies.filter(reply => !reply.parent_id));
    };

    const renderReply = (reply: Reply, depth = 0) => {
        const maxDepth = 4;
        const isDeleted = reply.is_deleted;
        const canModify = !isDeleted && reply.user.id === currentUser?.userId;
        const isHighlighted = reply.id.toString() === highlightedReplyId;
        
        return (
            <div 
                key={reply.id}
                ref={isHighlighted ? highlightedReplyRef : null}
                className={`${depth > 0 ? 'ml-3 sm:ml-6' : ''} mb-3 sm:mb-4 transition-all duration-300 ${
                    isHighlighted ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                }`}
            >
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-600">
  <Username user={reply.user} />
  <OPBadge user={reply.user} threadCreatorId={thread?.user.id ?? 0} />
  {" "}• {new Date(reply.created_at).toLocaleDateString()}
</p>
    <div className="flex items-center gap-2">
                                    {!isDeleted && depth < maxDepth && (
                                        <button
                                            onClick={() => setReplyingTo(reply.id)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            Reply
                                        </button>
                                    )}
                                    {canModify && (
  <>
    {deletingReplyId === reply.id ? (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {reply.children?.length ? 
            'Delete this reply? The content will be replaced with "[Deleted]".' :
            'Delete this reply?'
          }
        </span>
        <button
          onClick={async () => {
            await handleDeleteReply(reply.id);
            setDeletingReplyId(null);
          }}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
        >
          {deleteReplyMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : 'Delete'}
        </button>
        <button
          onClick={() => setDeletingReplyId(null)}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    ) : (
      <>
        <button
          onClick={() => setEditingReplyId(reply.id)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => setDeletingReplyId(reply.id)}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Delete
        </button>
      </>
    )}
  </>
)}
                                </div>
                            </div>
                            {editingReplyId === reply.id ? (
                                <div className="mt-2">
                                    <textarea
                                        defaultValue={reply.content}
                                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        rows={3}
                                        id={`edit-reply-${reply.id}`}
                                    />
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={() => {
                                                const content = (document.getElementById(`edit-reply-${reply.id}`) as HTMLTextAreaElement).value;
                                                handleEditReply(reply.id, content);
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingReplyId(null)}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`text-gray-800 ${isDeleted ? 'italic text-gray-500' : ''}`}>
                                    {reply.content}
                                </div>
                            )}
                        </div>
                        {!isDeleted && (
                            <VoteButtons
                                initialLikes={reply.likes}
                                initialDislikes={reply.dislikes}
                                initialUserVote={reply.userVote}
                                onVote={(voteType) => handleReplyVote(reply.id, voteType)}
                                size="small"
                                isLoggedIn={!!currentUser}
                            />
                        )}
                    </div>

                    {replyingTo === reply.id && (
                        <CreateReplyForm 
                            threadId={threadId}
                            parentId={reply.id}
                            onReplyCreated={handleReplyCreated}
                            onCancel={() => setReplyingTo(null)}
                            isNested={true}
                        />
                    )}

                    {reply.children && reply.children.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {reply.children.map(childReply => renderReply(childReply, depth + 1))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (isLoading || isLoadingUser) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">{(error as Error)?.message || 'An error occurred'}</p>
            </div>
        );
    }

    if (!thread) {
        return <div className="text-center py-8">Thread not found</div>;
    }

    // Get the image source from either image_url or by generating it from image_key
    const threadImageSrc = thread.image_url || 
                          (thread.image_key ? getImageUrl(thread.image_key) : 
                          (thread.image_key ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${thread.image_key}` : null));

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <Link 
                href="/forum"
                className="text-blue-500 hover:text-blue-600 mb-4 inline-block"
            >
                ← Back to Forum
            </Link>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-grow">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{thread.title}</h1>
                        {thread.user.id === currentUser?.userId && (
                            <div className="mt-2 flex gap-2">
                                {deletingThreadId === thread.id ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">
                                            Delete this thread and all its replies?
                                        </span>
                                        <button
                                            onClick={async () => {
                                                await deleteThreadMutation.mutateAsync();
                                                setDeletingThreadId(null);
                                            }}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                                        >
                                            {deleteThreadMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : 'Delete'}
                                        </button>
                                        <button
                                            onClick={() => setDeletingThreadId(null)}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            Edit Thread
                                        </button>
                                        <button
                                            onClick={() => setDeletingThreadId(thread.id)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                                        >
                                            Delete Thread
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <BookmarkButton
                                threadId={threadId}
                                initialBookmarkCount={thread.total_bookmarks || 0}
                                showCount={true}
                                isLoggedIn={!!currentUser}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            />
                            <span className="text-gray-500 -ml-1">{thread.total_bookmarks || 0}</span>
                        </div>
                        <VoteButtons
                            initialLikes={thread.likes}
                            initialDislikes={thread.dislikes}
                            initialUserVote={thread.userVote}
                            onVote={handleThreadVote}
                            isLoggedIn={!!currentUser}
                        />
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {thread.tags.map((tag) => (
                        <Link 
                            key={tag.id}
                            href={`/forum/tag/${encodeURIComponent(tag.name)}`}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
                        >
                            {tag.name}
                        </Link>
                    ))}
                </div>

                <p className="text-gray-600 mb-4">
                    Posted by <Username user={thread.user} /> • {new Date(thread.created_at).toLocaleDateString()}
                </p>

                <div className="prose max-w-none text-gray-800">
                    {thread.content}
                    
                    {threadImageSrc && !imageError && (
                        <div className="mt-4 flex justify-center relative w-full h-[400px]">
                            <Image
                                src={threadImageSrc}
                                alt="Thread image"
                                className="rounded-lg shadow-md object-contain"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                onError={() => setImageError(true)}
                                priority
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Replies ({thread.reply_count || 0})
                    </h2>
                    <SortControl currentSort={sortOption} onSortChange={setSortOption} />
                </div>
                
                <CreateReplyForm 
                    threadId={threadId} 
                    onReplyCreated={handleReplyCreated}
                />
                
                {thread.replies && thread.replies.length > 0 ? (
                    <div className="space-y-4 mt-6">
                        {getSortedReplies().map(reply => renderReply(reply))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                        No replies yet. Be the first to reply!
                    </div>
                )}
            </div>

            {isEditModalOpen && (
                <CreateThreadModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onCreateThread={handleEditThread}
                    initialData={thread}
                    isEditing={true}
                />
            )}
        </div>
    );
};

export default ThreadDetailPage;