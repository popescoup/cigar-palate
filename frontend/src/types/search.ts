// src/types/search.ts
export type PageNumber = number | '...';

export interface CigarResult {
    id: string;
    name: string;
    brand: string | null;
    flavors: string | string[];
    shape: string;
    size: string;
    color: string;
    wrap_type: string;
    filler: string;
    country_of_origin: string;
    aging: number;
    handmade: boolean;
    description: string;
    averageRating: number;
    resultType: 'cigars';
    price_range: string;
    strength: string;
    binder: string;
    searchableCharacteristics: string;
    dimensions: string;
    made_by: string;
}

export interface ForumResult {
    id: number;
    title: string;
    content: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        username: string;
        isAdmin: boolean;
    };
    tags: string[];  // Changed from object array to string array
    replyCount: number;
    vote_count: number;
    likes: number;
    dislikes: number;
    userVote: 'like' | 'dislike' | null;
    resultType: 'forum';
}

export interface BrandResult {
    id: number;
    name: string;
    averageRating: number;
    cigarCount: number;
    created_at: string;
    updated_at: string;
    resultType: 'brand';
}

export type SearchResult = CigarResult | ForumResult | BrandResult;

export interface SearchResponse {
    hits: SearchResult[];
    totalHits: number;
    currentPage: number;
    totalPages: number;
    hitsPerPage: number;
}