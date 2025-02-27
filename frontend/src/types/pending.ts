// src/types/pending.ts

export interface PendingSubmission {
  id: number;
  cigar_name: string;
  image_path: string;
  brand_id: number | null;
  new_brand_name: string | null;
  new_brand_image_path: string | null;
  new_brand_description: string | null;
  flavors: string;
  shape: string;
  size: string;
  color: string;
  wrap_type: string;
  filler: string;
  country_of_origin: string;
  aging: number;
  handmade: boolean;
  description: string;
  price_range: string | null;
  strength: string | null;
  binder: string | null;
  dimensions: string | null;
  made_by: string | null;
  submitter: {
    username: string;
  };
  submission_date: string;
  brand?: {
    name: string;
  };
}

export interface CardProps {
  selected: boolean;
  processing: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onDecline: () => void;
}