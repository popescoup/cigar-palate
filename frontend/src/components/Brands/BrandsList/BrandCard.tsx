import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Brand as BaseBrand } from '../types';

interface CardBadgeProps {
  icon?: LucideIcon;
  value: string | number;
  tooltip: string;
  position?: string;
  variant?: 'default' | 'rating' | 'count';
  className?: string;
}

const CardBadge: React.FC<CardBadgeProps> = ({ 
  icon: Icon,
  value,
  tooltip,
  position = 'top-2 right-2',
  variant = 'default'
}) => {
  const getVariantStyles = (variant: string, value: string | number): string => {
    const baseStyle = 'bg-white/80 backdrop-blur-[2px]';
    if (variant === 'rating') {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      if (numericValue >= 80) return `${baseStyle} text-green-600`;
      if (numericValue >= 60) return `${baseStyle} text-yellow-600`;
      return `${baseStyle} text-red-600`;
    }
    if (variant === 'count') return `${baseStyle} text-gray-600`;
    return `${baseStyle} text-gray-700`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`absolute ${position}`}>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${getVariantStyles(variant, value)}`}>
              {Icon && <Icon className="w-4 h-4" />}
              <span className={`text-sm ${variant === 'rating' ? 'font-semibold' : ''}`}>
                {value}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface BrandCardData extends BaseBrand {
  averageRating?: number;
  cigarCount?: number;
}

interface BrandCardProps {
  brand: BrandCardData;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  return (
    <Link href={`/brands/${brand.id}`} className="block h-full">
      <Card className="h-full transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative">
            {/* Image Section */}
            <div className="relative h-40 sm:h-48">
              {brand.image_path ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${brand.image_path}`}
                  alt={brand.name}
                  fill
                  className="object-cover rounded-t"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-t">
                  <span className="text-gray-400 text-base sm:text-lg">{brand.name}</span>
                </div>
              )}

              {/* Rating Badge */}
              {brand.averageRating && brand.averageRating > 0 && (
                <CardBadge
                  value={Math.round(brand.averageRating)}
                  tooltip="Average Rating"
                  variant="rating"
                  className="text-xs sm:text-sm"
                />
              )}

              {/* Cigar Count Badge */}
              {brand.cigarCount && brand.cigarCount > 0 && (
                <CardBadge
                  icon={Package}
                  value={brand.cigarCount}
                  tooltip="Number of Cigars"
                  variant="count"
                  position="top-2 left-2"
                  className="text-xs sm:text-sm"
                />
              )}
            </div>

            {/* Content Section */}
            <div className="p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{brand.name}</h2>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BrandCard;