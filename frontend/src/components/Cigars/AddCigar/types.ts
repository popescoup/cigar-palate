// components/cigars/AddCigar/types.ts

export interface Brand {
    id: number;
    name: string;
  }
  
  export interface FormData {
    // Required fields
    name: string;
    brand_id: number | '';
    new_brand: string;
    new_brand_description?: string;
    flavors: string;
    description: string;

    // Optional characteristic fields
    shape?: string;
    size?: string;
    color?: string;
    wrap_type?: string;
    filler?: string;
    country_of_origin?: string;
    aging?: string;
    handmade?: boolean;
    price_range?: string;
    strength?: string;
    binder?: string;
    dimensions?: string;
    made_by?: string;
}
  
export interface FormErrors {
  [key: string]: string;
}

export interface SectionProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors: FormErrors;
  setErrors?: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void;
}

// Price range options
export const PRICE_RANGES = [
  '<$10',
  '$10.01 - $25',
  '$25.01 - $50',
  '$50.01 - $75',
  '$75.01 - $100',
  '$100.01<'
] as const;

export type PriceRange = typeof PRICE_RANGES[number];