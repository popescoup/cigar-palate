// src/components/Username.tsx
import React from 'react';
import { User } from '@/types/user';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UsernameProps {
    user?: User | null;  // Make user optional and nullable
    className?: string;
    disableLink?: boolean;
}

const Username: React.FC<UsernameProps> = ({ user, className = '', disableLink = false }) => {
    const { currentUser } = useCurrentUser();

    // Handle cases where user is null or undefined
    if (!user) {
        return <span className={className}>Anonymous</span>;
    }

    const reputationValue = ((user?.reputation ?? 0) > 0)
        ? `+${user.reputation}`
        : (user.reputation ?? 0).toString();

    const isOwnProfile = currentUser?.userId === user.id;
    const profilePath = isOwnProfile ? '/profile' : `/profile/${user.username}`;

    const UsernameContent = () => (
        <>
            {user.username || 'Anonymous'}{' '}
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-gray-600 text-sm cursor-help">
                            ({' '}
                            <span className="border-b border-solid border-gray-500 hover:text-gray-800 transition-colors">
                                {reputationValue}
                            </span>
                            {' '})
                        </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-2">
                        <div className="flex flex-col gap-1">
                            <div>Reputation score reflects a user's contributions to the community and platform:</div>
                            <div className="pl-2">• +1/-1 point for each upvote/downvote received</div>
                            <div className="pl-2">• +10 points for each approved cigar database submission</div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </>
    );

    if (disableLink || !user.username) {
        return <span className={className}><UsernameContent /></span>;
    }

    return (
        <Link 
            href={profilePath}
            className={`${className} hover:text-blue-600 transition-colors`}
        >
            <UsernameContent />
        </Link>
    );
};

export default Username;