import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DollarSign, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Cigar } from '@/types/cigars';
import { getImageUrl } from '@/utils/imageUtils';

interface CardBadgeProps {
  icon?: LucideIcon;
  value: string | number;
  tooltip: string;
  position?: string;
  variant?: 'default' | 'rating' | 'price';
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
    if (variant === 'price') return `${baseStyle} text-emerald-600`;
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

interface FlavorTagsProps {
  flavors: string[];
  maxDisplay?: number;
}

const FlavorTags: React.FC<FlavorTagsProps> = ({ flavors, maxDisplay = 3 }) => {
  const displayedFlavors = flavors.slice(0, maxDisplay);
  const remainingCount = flavors.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayedFlavors.map((flavor: string, index: number) => (
        <span
          key={index}
          className="px-2 py-0.5 text-xs font-medium rounded
                   bg-gradient-to-r from-gray-50 to-gray-100 
                   text-gray-700 border border-gray-200/50
                   transition-all duration-200 hover:shadow-sm"
        >
          {flavor.trim()}
        </span>
      ))}
      
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="px-2 py-0.5 text-xs font-medium rounded
                            bg-gradient-to-r from-gray-100 to-gray-200 
                            text-gray-600 cursor-help
                            transition-all duration-200 hover:shadow-sm">
                +{remainingCount}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium mb-1">Additional flavors:</p>
                <p className="text-sm">
                  {flavors.slice(maxDisplay).join(', ')}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

interface CigarCardProps {
  cigar: Cigar;
}

const CigarCard: React.FC<CigarCardProps> = ({ cigar }) => {
  const parseFlavors = (flavors: string | string[]): string[] => {
    if (Array.isArray(flavors)) {
      return flavors;
    }
    try {
      return JSON.parse(flavors);
    } catch {
      return [];
    }
  };

  const flavorsList = parseFlavors(cigar.flavors);
  
  // Get the image source from either image_url or by generating it from image_key
  const imageSrc = cigar.image_url || (cigar.image_key ? getImageUrl(cigar.image_key) : null);

  return (
    <Link href={`/cigars/${cigar.id}`} className="block h-full">
      <Card className="h-full transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative">
            {/* Image Section */}
            <div className="relative h-40 sm:h-48">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={cigar.name}
                  width={800}
                  height={600}
                  className="w-full h-40 sm:h-48 object-cover rounded-t"
                  priority={false}
                />
              ) : (
                <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-t">
                  <span className="text-gray-400 text-base sm:text-lg">{cigar.name}</span>
                </div>
              )}

              {/* Badges */}
              {cigar.averageRating > 0 && (
                <CardBadge
                  value={Math.round(cigar.averageRating)}
                  tooltip="Rating"
                  variant="rating"
                  className="text-xs sm:text-sm"
                />
              )}

              {cigar.price_range && (
                <CardBadge
                  icon={DollarSign}
                  value={cigar.price_range}
                  tooltip="Price Range"
                  variant="price"
                  position="top-2 left-2"
                  className="text-xs sm:text-sm"
                />
              )}
            </div>

            {/* Content Section */}
            <div className="p-3 sm:p-4">
              {/* Title and Brand */}
              <div className="mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{cigar.name}</h2>
                <p className="text-xs sm:text-sm text-gray-600">{cigar.brand?.name || 'Unknown Brand'}</p>
              </div>

              {/* Flavors Section */}
              {flavorsList.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Flavor Profile</h3>
                  <FlavorTags flavors={flavorsList} />
                </div>
              )}

              {/* Rating Count */}
              <div className="text-xs sm:text-sm text-gray-500">
                {cigar.numberOfRatings} {cigar.numberOfRatings === 1 ? 'rating' : 'ratings'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CigarCard;