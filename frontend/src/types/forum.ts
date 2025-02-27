// src/types/forum.ts

import { User } from './user';
import { Review } from './cigars';

export interface Tag {
    id: number;
    name: string;
}

export interface Thread {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  image_path: string | null;  // Add this line
  user: User;
  tags: Tag[];
  replies?: Reply[];
  reply_count: number;
  vote_count: number;
  likes: number;       
  dislikes: number;    
  userVote: 'like' | 'dislike' | null;
  is_deleted?: boolean;
  last_edited_at?: string;
  total_bookmarks: number;
}

export interface Reply {
  id: number;
  content: string;
  thread_id: number;
  user_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  user: User;
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
  vote_count: number;
  children?: Reply[];
  is_deleted?: boolean;
  has_children?: boolean;
  last_edited_at?: string;
}

export interface CreateThreadData {
  title: string;
  content: string;
  tags: string[];
  image?: File;
}

// Add a new type for form data submissions
export type ThreadFormData = CreateThreadData | FormData;

export interface CreateReplyData {
  content: string;
}

export interface UpdateThreadData extends Partial<CreateThreadData> {
  id: number;
}

export interface UpdateReplyData {
  id: number;
  content: string;
}