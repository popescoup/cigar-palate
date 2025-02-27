'use client'

import React from 'react';

export type SortOption = 'trending' | 'newest' | 'most-liked' | 'most-disliked';

interface SortControlProps {
    currentSort: SortOption;
    onSortChange: (sort: SortOption) => void;
    className?: string;
}

const SortControl: React.FC<SortControlProps> = ({ 
    currentSort, 
    onSortChange, 
    className = '' 
}) => {
    return (
        <div className={`flex flex-wrap items-center gap-2 w-full sm:w-auto ${className}`}>
  <span className="text-gray-600 text-xs sm:text-sm">Sort by:</span>
  <div className="flex flex-wrap gap-1">
            <button
                    onClick={() => onSortChange('trending')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                        currentSort === 'trending'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Trending
                </button>
                <button
                    onClick={() => onSortChange('newest')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                        currentSort === 'newest'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Newest
                </button>
                <button
                    onClick={() => onSortChange('most-liked')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                        currentSort === 'most-liked'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Most Liked
                </button>
                <button
                    onClick={() => onSortChange('most-disliked')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                        currentSort === 'most-disliked'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Most Disliked
                </button>
            </div>
        </div>
    );
};

export default SortControl;