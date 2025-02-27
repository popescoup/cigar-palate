'use client';
import React from 'react';

interface SortOption {
    label: string;
    value: string;
}

interface SortSectionProps {
    sortOptions: SortOption[];
    currentSort?: string;
    searchParams: Record<string, string>;
    baseUrl: string;
}

export const SortSection: React.FC<SortSectionProps> = ({ 
    sortOptions, 
    currentSort,
    searchParams,
    baseUrl
}) => {
    const handleSort = (value: string, isActive: boolean) => {
        console.log('handleSort called with:', { value, isActive }); // Debug log
        
        const params = new URLSearchParams(searchParams);
        
        if (!isActive) {
            params.set('sort', value);
            console.log('Setting sort parameter:', value);
        } else {
            params.delete('sort');
            console.log('Removing sort parameter');
        }
        params.set('page', '1');
        
        const newUrl = `${baseUrl}?${params.toString()}`;
        console.log('New URL:', newUrl);
        window.location.href = newUrl;
    };

    // Debug log for initial render
    React.useEffect(() => {
        console.log('SortSection rendered with:', {
            currentSort,
            sortOptions,
            searchParams
        });
    }, [currentSort, sortOptions, searchParams]);

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Sort By</h2>
            <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => {
                    const isActive = option.value === currentSort;
                    console.log('Rendering option:', { 
                        option, 
                        isActive, 
                        currentSort 
                    }); // Debug each option
                    return (
                        <button
                            key={option.value}
                            onClick={() => handleSort(option.value, isActive)}
                            className={`px-3 py-1 rounded-full transition ${
                                isActive
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-100 text-black hover:bg-gray-200'
                            }`}
                        >
                            {option.label}
                            {isActive && (
                                <span className="ml-2">✕</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};