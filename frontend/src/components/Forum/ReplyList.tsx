// components/Forum/ReplyList.tsx

/*
	•	Renders a list of replies for a forum thread, displaying each reply’s author, content, and post time.
	•	Supports nested replies, allowing users to reply to specific comments within a configurable depth level.
	•	Provides a text area for users to write and submit replies, with Submit and Cancel buttons, resetting the input after submission.
	•	Calls onReplySubmit to handle reply creation, updating the reply state as needed.
*/

'use client'

import React from 'react';
import { Reply } from '@/types/forum';
import { formatDistanceToNow } from 'date-fns';
import Username from '@/components/Username';

interface ReplyListProps {
  replies: Reply[];
  onReplySubmit: (content: string, parentId?: number) => Promise<void>;
}

const ReplyList: React.FC<ReplyListProps> = ({ replies, onReplySubmit }) => {
  const [replyingTo, setReplyingTo] = React.useState<number | null>(null);
  const [replyContent, setReplyContent] = React.useState('');

  const handleReplySubmit = async (parentId?: number) => {
    if (!replyContent.trim()) return;
    await onReplySubmit(replyContent, parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  const renderReply = (reply: Reply, depth = 0) => (
    <div 
      key={reply.id}
      className={`${depth > 0 ? 'ml-3 sm:ml-6' : ''} mb-3 sm:mb-4`}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
    <Username user={reply.user} className="font-medium" />
    <span className="text-sm text-gray-500">
        • {formatDistanceToNow(new Date(reply.created_at))} ago
    </span>
</div>
          <button
            onClick={() => setReplyingTo(reply.id)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Reply
          </button>
        </div>

        <div className="prose max-w-none text-base sm:text-lg">
          {reply.content}
        </div>

        {replyingTo === reply.id && (
          <div className="mt-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Write your reply..."
              rows={3}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleReplySubmit(reply.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {reply.children && reply.children.length > 0 && (
          <div className="mt-4">
            {reply.children.map(childReply => renderReply(childReply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {replies.map(reply => renderReply(reply))}
    </div>
  );
};

export default ReplyList;