// lib/searchOptions.ts
export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterCategory {
    category: string;
    options: FilterOption[];
    allowMultiple?: boolean;
}

export interface SortOption {
    label: string;
    value: string;
}

export const cigarFilterOptions: FilterCategory[] = [
    {
        category: 'Price Range',
        options: [
            { label: 'Under $10', value: 'price_range=<$10' },
            { label: '$10 - $25', value: 'price_range=$10.01 - $25' },
            { label: '$25 - $50', value: 'price_range=$25.01 - $50' },
            { label: '$50 - $75', value: 'price_range=$50.01 - $75' },
            { label: '$75 - $100', value: 'price_range=$75.01 - $100' },
            { label: 'Over $100', value: 'price_range=$100.01<' }
        ],
        allowMultiple: false
    }
];

// Sort options remain unchanged
export const cigarSortOptions: SortOption[] = [
    { label: 'Highest Rated', value: 'averageRating:desc' },
    { label: 'Most Popular', value: 'popularityScore:desc' }
];

export const forumSortOptions: SortOption[] = [
    { label: 'Newest', value: 'created_at:desc' },
    { label: 'Oldest', value: 'created_at:asc' },
    { label: 'Most Liked', value: 'vote_count:desc' },
    { label: 'Most Disliked', value: 'vote_count:asc' },
    { label: 'Most Replies', value: 'replyCount:desc' },
    { label: 'Least Replies', value: 'replyCount:asc' }
];

export const brandSortOptions: SortOption[] = [
    { label: 'Highest Average Rating', value: 'averageRating:desc' },
    { label: 'Lowest Average Rating', value: 'averageRating:asc' },
    { label: 'Largest Catalog', value: 'cigarCount:desc' },
    { label: 'Smallest Catalog', value: 'cigarCount:asc' }
];