// components/Brands/types.ts
export interface Brand {
  id: number;
  name: string;
  image_path: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}
  
export interface Cigar {
  id: number;
  name: string;
  image_path?: string | null;
  averageRating: number;
  numberOfRatings: number;
  totalRatings: number;
  total_bookmarks: number;
  flavors: string | string[];
  price_range?: string;
  brand: {    // Changed from optional to required and added id
    id: number;
    name: string;
  } | null;   // Changed from undefined to null
  shape?: string;
  size?: string;
  color?: string;
  wrap_type?: string;
  filler?: string;
  country_of_origin?: string;
  binder?: string;
  strength?: string;
  aging?: number;
  handmade?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
  
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalBrands: number;
}