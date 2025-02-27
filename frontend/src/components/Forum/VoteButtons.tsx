// src/components/Forum/VoteButtons.tsx
'use client'

import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';

interface VoteButtonsProps {
    initialLikes: number;
    initialDislikes: number;
    initialUserVote: 'like' | 'dislike' | null;
    onVote: (voteType: 'like' | 'dislike') => Promise<void>;
    size?: 'small' | 'regular';
    isLoggedIn?: boolean;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({ 
    initialLikes = 0, 
    initialDislikes = 0,
    initialUserVote = null,
    onVote,
    size = 'regular',
    isLoggedIn = false
}) => {
    const [likes, setLikes] = useState(initialLikes);
    const [dislikes, setDislikes] = useState(initialDislikes);
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(initialUserVote);
    const [isVoting, setIsVoting] = useState(false);

    useEffect(() => {
        setLikes(initialLikes);
        setDislikes(initialDislikes);
        setUserVote(initialUserVote);
    }, [initialLikes, initialDislikes, initialUserVote]);

    const handleVote = async (voteType: 'like' | 'dislike') => {
        if (isVoting || !isLoggedIn) return;
        
        setIsVoting(true);
        try {
            await onVote(voteType);
        } catch (err) {
            console.error('Error voting:', err);
        } finally {
            setIsVoting(false);
        }
    };

    const buttonBaseClasses = `flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md transition-colors 
    ${size === 'small' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}
        ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`;

    const renderVoteButton = (voteType: 'like' | 'dislike') => {
        const button = (
            <button
                onClick={() => handleVote(voteType)}
                disabled={isVoting || !isLoggedIn}
                className={`${buttonBaseClasses} ${
                    userVote === voteType
                        ? voteType === 'like' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d={voteType === 'like' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                    />
                </svg>
                <span>{voteType === 'like' ? likes : dislikes}</span>
            </button>
        );

        return !isLoggedIn ? (
            <Tooltip content="Only logged in users can perform this action">
                {button}
            </Tooltip>
        ) : button;
    };

    return (
        <div className="flex items-center gap-2">
            {renderVoteButton('like')}
            {renderVoteButton('dislike')}
        </div>
    );
};

export default VoteButtons;