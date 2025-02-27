'use client';

import React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterCategory {
    category: string;
    options: FilterOption[];
    allowMultiple?: boolean;
}

interface FilterSectionProps {
    filterOptions: FilterCategory[];
    activeFilters: string[];
}

export const FilterSection: React.FC<FilterSectionProps> = ({ 
    filterOptions,
    activeFilters
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // There will only be one category (Price Range) for cigars
    const priceRangeCategory = filterOptions[0];

    if (!priceRangeCategory) {
        return null;
    }

    const isFilterActive = (value: string): boolean => {
        return activeFilters.includes(value);
    };

    const handleFilterClick = (value: string, isActive: boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Handle the filter change
        if (isActive) {
            // Remove the filter
            const newFilters = activeFilters.filter(f => f !== value);
            if (newFilters.length > 0) {
                params.set('filters', newFilters.join(','));
            } else {
                params.delete('filters');
            }
        } else {
            // Add the filter (replacing any existing price filter)
            params.set('filters', value);
        }
        
        // Reset to page 1 when changing filters
        params.set('page', '1');
        
        // Update the URL
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Filter By Price</h2>
            <div className="flex flex-wrap gap-2">
                {priceRangeCategory.options.map((option) => {
                    const isActive = isFilterActive(option.value);
                    return (
                        <button
                            key={option.value}
                            onClick={() => handleFilterClick(option.value, isActive)}
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