// src/components/Forum/CreateReplyForm.tsx

/*
	•	Provides a form for submitting replies to a thread, with support for both top-level and nested replies.
	•	Accepts props for threadId, optional parentId (for nested replies), onReplyCreated callback, onCancel callback, and an isNested flag to adjust styling.
	•	Manages content input, error handling, and a loading state while submitting.
	•	Includes Cancel and Post Reply buttons, with the form resetting after successful submission or cancellation for nested replies.
*/

'use client'

import React, { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const sanitizeInput = (text: string): string => {
    return text
      .replace(/<[^>]*>/g, ''); // Remove HTML tags
  };

  const validateContent = (content: string): string | null => {
    if (content.trim().length < 1) {
      return 'Reply must not be empty';
    }
    if (content.length > 1000) {
      return 'Reply cannot exceed 1000 characters';
    }
    // Check for repeated characters (spam prevention)
    const repeatedCharsRegex = /(.)\1{4,}/;
    if (repeatedCharsRegex.test(content)) {
      return 'Reply contains too many repeated characters';
    }
    return null;
  };

interface CreateReplyFormProps {
    threadId: number;
    parentId?: number;
    onReplyCreated: () => void;
    onCancel?: () => void;
    isNested?: boolean;
}

const CreateReplyForm: React.FC<CreateReplyFormProps> = ({ 
    threadId, 
    parentId,
    onReplyCreated, 
    onCancel,
    isNested 
}) => {
    const { currentUser, isLoading } = useCurrentUser();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError('Please log in or create an account to leave a reply.');
            return;
        }
    
        const sanitizedContent = sanitizeInput(content);
        const contentError = validateContent(sanitizedContent);
        
        if (contentError) {
            setError(contentError);
            return;
        }
    
        setIsSubmitting(true);
        setError(null);
    
        try {
            const response = await fetch(`/api/threads/${threadId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    content: sanitizedContent,
                    parentId
                }),
            });
    
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please log in or create an account to leave a reply.');
                }
                throw new Error('Failed to create reply');
            }
    
            setContent('');
            onReplyCreated();
            if (onCancel) onCancel();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to post reply. Please try again.');
            console.error('Error creating reply:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formClasses = isNested 
        ? "bg-gray-50 rounded-lg p-4 mt-4" 
        : "bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6";

    if (isLoading) {
        return <div className={formClasses}>Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className={formClasses}>
            <div className="space-y-4">
                <div>
                    {!isNested && (
                        <label htmlFor="reply" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                            Your Reply
                        </label>
                    )}
                    <div className="relative">
    <textarea
        id="reply"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={currentUser 
            ? "Write your reply..." 
            : "Please log in or create an account to leave a reply."}
        rows={isNested ? 3 : 4}
        maxLength={1000}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        disabled={isSubmitting || !currentUser}
    />
    <div className="absolute bottom-2 right-2 text-sm text-gray-500">
        {1000 - content.length} characters remaining
    </div>
</div>
                </div>

                {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}

                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || !content.trim() || !currentUser}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default CreateReplyForm;