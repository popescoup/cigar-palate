import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/axiosConfig';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import VoteButtons from '@/components/Forum/VoteButtons';
import Username from '@/components/Username';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types/user';
import type { Review } from '@/types/cigars';
import type { ChangeEvent } from 'react';
import type { AxiosError } from 'axios';

const sanitizeReplyText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

interface ReviewReplyProps {
  review: Review;
  currentUser: User | null;
  cigarId: string;
  onReplySubmitted: () => void;
  depth: number;
  queryClient: any;
  forceExpanded?: boolean;
  highlightedReviewId?: string;
  highlightRef?: React.RefObject<HTMLDivElement>;
  onExpandParent?: () => void;
}

const ReviewReply: React.FC<ReviewReplyProps> = ({
  review,
  currentUser,
  cigarId,
  onReplySubmitted,
  depth,
  queryClient,
  forceExpanded,
  highlightedReviewId,
  highlightRef,
  onExpandParent
}) => {
  const selfRef = useRef<HTMLDivElement>(null);
  const actualRef = depth === 0 ? highlightRef : selfRef;
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(review.comment);
  const [validationError, setValidationError] = useState<string>('');
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [hasNavigatedToHighlight, setHasNavigatedToHighlight] = useState(false);

  const isHighlightedOrHasHighlightedChild = useCallback((reviewToCheck: Review): boolean => {
    if (reviewToCheck.id.toString() === highlightedReviewId) {
      return true;
    }
    if (reviewToCheck.replies) {
      return reviewToCheck.replies.some(reply => isHighlightedOrHasHighlightedChild(reply));
    }
    return false;
  }, [highlightedReviewId]);

  useEffect(() => {
    if (highlightedReviewId) {
      // If this review is highlighted or contains the highlighted reply
      if (isHighlightedOrHasHighlightedChild(review)) {
        setRepliesExpanded(true);
        // Recursively expand all parent reviews
        if (onExpandParent) {
          onExpandParent();
        }
      }
    }
  }, [highlightedReviewId, review, onExpandParent, isHighlightedOrHasHighlightedChild]);

  useEffect(() => {
    if (review.id.toString() === highlightedReviewId && actualRef?.current) {
      setTimeout(() => {
        actualRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        setHasNavigatedToHighlight(true);  // Add this line
      }, 300);
    }
  }, [highlightedReviewId, review.id, actualRef]);

  // Calculate total number of nested replies
  const getTotalReplies = (review: Review): number => {
    let count = review.reply_count || 0;
    if (review.replies) {
      review.replies.forEach(reply => {
        count += getTotalReplies(reply);
      });
    }
    return count;
  };

  const totalReplies = getTotalReplies(review);

  const isExpanded = depth === 0 ? repliesExpanded : forceExpanded;

  const validateComment = (text: string): boolean => {
    // Check for minimum length of actual content
    if (text.trim().length < 1) {
      setValidationError('Comment must be at least 1 character long');
      return false;
    }
  
    // Check maximum length
    if (text.length > 1000) {
      setValidationError('Comment cannot exceed 1000 characters');
      return false;
    }
  
    // Check for repeated characters (spam prevention)
    const repeatedCharsRegex = /(.)\1{4,}/;
    if (repeatedCharsRegex.test(text)) {
      setValidationError('Comment contains too many repeated characters');
      return false;
    }
  
    // Check for minimum word count
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 1) {
      setValidationError('Comment must contain at least 1 words');
      return false;
    }
  
    setValidationError('');
    return true;
  };

  const replyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/cigars/${cigarId}/reviews`, {
        comment: replyText.trim(),
        parentId: review.id
      });
      return response.data;
    },
    onSuccess: () => {
      setReplyText('');
      setIsReplying(false);
      setRepliesExpanded(true); // Auto-expand replies when adding a new one
      onReplySubmitted();
    },
    onError: (error) => {
      console.error('Reply submission error:', error);
      alert('Failed to submit reply');
    }
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/api/reviews/${review.id}`, {
        comment: editText.trim()
      });
      return response.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['reviews', cigarId] });
    },
    onError: (error) => {
      console.error('Edit submission error:', error);
      alert('Failed to edit reply');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/api/reviews/${review.id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', cigarId] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Failed to delete reply');
    }
  });

  const voteMutation = useMutation({
    mutationFn: async ({ reviewId, voteType }: { reviewId: number; voteType: 'like' | 'dislike' }) => {
      const response = await api.post(`/api/reviews/${reviewId}/vote`, { voteType });
      return { reviewId, ...response.data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', cigarId] });
    },
    onError: (error) => {
      if (error instanceof Error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          alert('Please log in to vote');
        } else {
          alert('Failed to vote on review');
        }
      }
    }
  });

  const handleReplySubmit = () => {
    const sanitizedText = sanitizeReplyText(replyText);
    if (!validateComment(sanitizedText)) return;
    replyMutation.mutate();
  };
  
  const handleEditSubmit = () => {
    const sanitizedText = sanitizeReplyText(editText);
    if (!validateComment(sanitizedText)) return;
    editMutation.mutate();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <div 
    className={`${depth > 0 ? 'ml-3 sm:ml-6' : ''} mb-4`}
        ref={review.id.toString() === highlightedReviewId ? actualRef : undefined}
    >
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 transition-all duration-300 ${
  review.id.toString() === highlightedReviewId ? 'ring-2 ring-blue-400 bg-blue-50' : ''
}`}>
        {/* Top section with username, timestamp, and vote buttons */}
<div className="flex justify-between items-start mb-4">
  {/* Left side with user info */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
    <Username user={review.user} className="font-medium" />
    <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
      {new Date(review.created_at).toLocaleDateString()}
      {!review.is_deleted && review.is_edited && " (edited)"}
    </span>
  </div>
  
  {/* Right side with voting */}
  <VoteButtons
    initialLikes={review.likes}
    initialDislikes={review.dislikes}
    initialUserVote={review.userVote}
    onVote={(voteType) => voteMutation.mutateAsync({ 
      reviewId: review.id, 
      voteType 
    })}
    size="small"
    isLoggedIn={!!currentUser}
  />
</div>

{/* Content section */}
{!isEditing ? (
  <div className="prose max-w-none mb-4">
    {review.is_deleted ? (
      <span className="text-gray-500 italic">[deleted]</span>
    ) : (
      review.comment
    )}
  </div>
) : (
  <div className="space-y-2 mb-4">
    <div className="relative">
  <Textarea
    value={editText}
    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
      const sanitizedText = sanitizeReplyText(e.target.value);
      setEditText(sanitizedText);
    }}
    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    rows={3}
    maxLength={1000}
  />
  <div className="absolute bottom-2 right-2 text-sm text-gray-500">
    {1000 - editText.length} characters remaining
  </div>
</div>
    {validationError && (
      <p className="text-sm text-red-500">{validationError}</p>
    )}
    <div className="mt-2 flex gap-2">
      <button
        onClick={handleEditSubmit}
        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        disabled={editMutation.isPending}
      >
        {editMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : 'Save'}
      </button>
      <button
        onClick={() => {
          setIsEditing(false);
          setEditText(review.comment);
          setValidationError('');
        }}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{/* Bottom section with action buttons */}
<div className="flex justify-end items-center gap-2 mt-4">
{currentUser?.id === review.user?.id && !review.is_deleted && (
    <>
      {!isConfirmingDelete ? (
        // Normal action buttons
        <>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => setIsConfirmingDelete(true)}
            className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
          >
            Delete
          </button>
        </>
      ) : (
        // Delete confirmation buttons
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-gray-500">
  Are you sure you want to delete this {depth === 0 ? 'review' : 'reply'}?
</span>
          <button
            onClick={() => {
              deleteMutation.mutate();
              setIsConfirmingDelete(false);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs sm:text-sm font-medium"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : 'Delete'}
          </button>
          <button
            onClick={() => setIsConfirmingDelete(false)}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs sm:text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  )}
  {depth < 3 && currentUser && !review.is_deleted && !isConfirmingDelete && (
    <button
      onClick={() => setIsReplying(!isReplying)}
      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium ml-4"
    >
      Reply
    </button>
  )}
</div>

        {/* Reply form */}
        {isReplying && (
  <div className="mt-4">
    <div className="relative">
      <Textarea
        placeholder="Write your reply..."
        value={replyText}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          const sanitizedText = sanitizeReplyText(e.target.value);
          setReplyText(sanitizedText);
        }}
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        maxLength={1000}
      />
      <div className="absolute bottom-2 right-2 text-sm text-gray-500">
        {1000 - replyText.length} characters remaining
      </div>
    </div>
    {validationError && (
      <p className="text-sm text-red-500">{validationError}</p>
    )}
    <div className="mt-2 flex gap-2">
              <button
                onClick={handleReplySubmit}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : 'Submit'}
              </button>
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyText('');
                  setValidationError('');
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Show/Hide Replies buttons and Replies section */}
{totalReplies > 0 && !isExpanded && depth === 0 && (
  <div className="mt-4">
    <button
      onClick={() => setRepliesExpanded(true)}
      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
    >
      Show {totalReplies} {totalReplies === 1 ? 'Reply' : 'Replies'}
    </button>
  </div>
)}

{isExpanded && (
  <div className="mt-4">
    {review.replies?.map((reply: Review) => (
  <ReviewReply
    key={reply.id}
    review={reply}
    currentUser={currentUser}
    cigarId={cigarId}
    onReplySubmitted={onReplySubmitted}
    depth={depth + 1}
    queryClient={queryClient}
    forceExpanded={isExpanded}
    highlightedReviewId={highlightedReviewId}
    highlightRef={actualRef}
    onExpandParent={() => setRepliesExpanded(true)}  // Add this line
  />
))}
    {depth === 0 && (
      <button
        onClick={() => setRepliesExpanded(false)}
        className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mt-2"
      >
        Hide Replies
      </button>
    )}
  </div>
)}
      </div>
    </div>
  );
};

export default ReviewReply;