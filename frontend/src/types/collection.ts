// types/collection.ts
import { Cigar } from './cigars';

export interface Brand {
  id: number;
  name: string;
  avgRating: number;
  cigarCount: number;
  recentRatingsCount?: number;
  recentReviewsCount?: number;
  totalRecentInteractions?: number;
  image_path?: string;
}

export interface ScrollItem {
  id: number | string;
  href: string;
  title: string;
  subtitle: string;
  value: string | number;
  image_path?: string;
  numberOfRatings?: number;
  flavors?: string | string[];
  price_range?: string;
  cigarCount?: number;
}

export interface CollectionSectionProps {
  initialData?: {
    topCigars?: Cigar[];
    topBrands?: Brand[];
    trendingCigars?: Cigar[];
    trendingBrands?: Brand[];
  };
}