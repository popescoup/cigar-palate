// src/types/cigars.ts

import { User } from './user';

export interface Cigar {
    id: number;
    name: string;
    brand: { id: number, name: string } | null;
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
    image_key: string;
    image_url?: string;
    price_range: string;
    strength: string;
    binder: string;
    dimensions: string;
    made_by: string;
    totalRatings: number;
    numberOfRatings: number;
    averageRating: number;
    total_bookmarks: number;
    recentRatingsCount?: number;
    recentReviewsCount?: number;
}

export interface Review {
    id: number;
    comment: string;
    user_id: number;
    cigar_id: number;
    created_at: string;
    updated_at: string;
    user: User;
    vote_count: number;
    likes: number;
    dislikes: number;
    userVote: 'like' | 'dislike' | null;
    last_edited_at?: string;
    // New fields
    is_edited: boolean;
    edited_at: string | null;
    is_deleted: boolean;  // New field
    deleted_at: Date | null;  // New field
    parent_id: number | null;
    path: string | null;
    depth: number;
    reply_count: number;
    replies?: Review[];  // For nested replies
}

export interface FlavorRanking {
    flavor: string;
    averageRank: number;
    userRank: number | null;
}