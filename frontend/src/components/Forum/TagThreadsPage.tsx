'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Thread } from '@/types/forum';
import ThreadsList from './ThreadsList';
import Link from 'next/link';
import SortControl, { SortOption } from './SortControl';

interface TagThreadsPageProps {
    tagName: string;
}

const fetchThreadsByTag = async (tagName: string): Promise<Thread[]> => {
    const { data } = await axios.get(
        `/api/tags/${encodeURIComponent(tagName)}/threads`,
        { withCredentials: true }
    );
    return data;
};

const TagThreadsPage: React.FC<TagThreadsPageProps> = ({ tagName }) => {
    const [sortOption, setSortOption] = React.useState<SortOption>('newest');

    const { 
        data: threads = [], 
        isLoading, 
        isError, 
        error 
    } = useQuery({
        queryKey: ['tagThreads', tagName],
        queryFn: () => fetchThreadsByTag(tagName),
    });

    const getSortedThreads = () => {
        return [...threads].sort((a, b) => {
            switch (sortOption) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'most-liked':
                    return (b.vote_count || 0) - (a.vote_count || 0);
                case 'most-disliked':
                    return (a.vote_count || 0) - (b.vote_count || 0);
                default:
                    return 0;
            }
        });
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="mb-6">
                <Link 
                    href="/forum"
                    className="text-blue-500 hover:text-blue-600 mb-4 inline-block"
                >
                    ← Back to Forum
                </Link>
                
                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                            Threads tagged with "{tagName}"
                        </h1>
                        <div className="ml-4">
                            <SortControl 
                                currentSort={sortOption} 
                                onSortChange={setSortOption}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <p className="text-red-700">
                        {(error as Error)?.message || 'Failed to fetch threads'}
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-8 text-white">Loading...</div>
            ) : threads.length === 0 && !isError ? (
                <div className="text-center py-8 text-gray-400">
                    No threads found with this tag.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <ThreadsList threads={getSortedThreads()} />
                </div>
            )}
        </div>
    );
};

export default TagThreadsPage;