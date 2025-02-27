import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ArrowRight, DollarSign, Package, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from 'next/image';

interface ScrollableCardItemProps {
  href: string;
  title: string;
  subtitle: string;
  value: string | number;
  imagePath?: string;
  numberOfRatings?: number;
  flavors?: string | string[];
  priceRange?: string;
  cigarCount?: number;
  variant: 'cigar' | 'brand';
}

interface ScrollItem {
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

interface HorizontalScrollSectionProps {
  title: string;
  items: ScrollItem[];
  variant: 'cigar' | 'brand';
  viewAllHref?: string;
  viewAllText?: string;
}

interface ViewAllCardProps {
  href: string;
  text?: string;
}

interface TouchPosition {
  x: number;
  y: number;
}

const CARD_WIDTH = {
  mobile: 280,  // Smaller cards on mobile
  desktop: 320
};
const CARD_GAP = {
  mobile: 16,   // Smaller gap on mobile
  desktop: 24
};
const getItemsPerView = () => {
  if (typeof window === 'undefined') return 3; // Default for SSR
  if (window.innerWidth < 640) return 1;  // mobile
  if (window.innerWidth < 1024) return 2; // tablet
  return 3; // desktop
};

const CardBadge: React.FC<{
  icon?: LucideIcon;
  value: string | number;
  tooltip: string;
  position?: string;
  variant?: 'default' | 'rating' | 'price' | 'count';
}> = ({ 
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
        <TooltipContent className="z-50">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const FlavorTags: React.FC<{flavors: string[]}> = ({ flavors }) => {
  const displayedFlavors = flavors.slice(0, 3);
  const remainingCount = flavors.length - 3;

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
                  {flavors.slice(3).join(', ')}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

const formatRating = (rating: number | string): number => {
  if (!rating || rating === 0) return 0;
  const num = typeof rating === 'string' ? parseFloat(rating) : rating;
  return Math.round(num);
};

const parseFlavors = (flavors: string | string[] | undefined): string[] => {
  if (!flavors) return [];
  if (Array.isArray(flavors)) return flavors;
  try {
    return JSON.parse(flavors);
  } catch {
    return flavors.split(',').map(f => f.trim());
  }
};

const ScrollableCardItem = ({
  href,
  title,
  subtitle,
  value,
  imagePath,
  numberOfRatings,
  flavors,
  priceRange,
  cigarCount,
  variant
}: ScrollableCardItemProps) => {
  const flavorsList = parseFlavors(flavors);
  const rating = typeof value === 'string' ? parseFloat(value) : value;

  return (
    <Link href={href} className="shrink-0 w-[280px] sm:w-80 block h-full">
      <Card className="h-full transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative">
            {/* Image Section */}
            <div className="relative h-40 sm:h-48">
              {imagePath ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${imagePath}`}
                  alt={title}
                  width={800}
                  height={600}
                  className="w-full h-40 sm:h-48 object-cover rounded-t"
                  priority={false}
                />
              ) : (
                <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-t">
                  <span className="text-gray-400 text-base sm:text-lg">{title}</span>
                </div>
              )}

              {/* Rating Badge */}
              {rating !== undefined && rating !== null && rating > 0 && (
                <CardBadge
                  value={formatRating(rating)}
                  tooltip={variant === 'cigar' ? 'Rating' : 'Average Rating'}
                  variant="rating"
                />
              )}

              {/* Price/Count Badge */}
              {variant === 'cigar' && priceRange ? (
                <CardBadge
                  icon={DollarSign}
                  value={priceRange}
                  tooltip="Price Range"
                  variant="price"
                  position="top-2 left-2"
                />
              ) : variant === 'brand' && cigarCount !== undefined ? (
                <CardBadge
                  icon={Package}
                  value={cigarCount}
                  tooltip="Number of Cigars"
                  variant="count"
                  position="top-2 left-2"
                />
              ) : null}
            </div>

            {/* Content Section - remains unchanged */}
            <div className="p-3 sm:p-4">
              {variant === 'cigar' ? (
                <>
                  <div className="mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{title}</h2>
                    <p className="text-xs sm:text-sm text-gray-600">{subtitle}</p>
                  </div>

                  {flavorsList.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Flavor Profile</h3>
                      <FlavorTags flavors={flavorsList} />
                    </div>
                  )}

                  <div className="text-xs sm:text-sm text-gray-500">
                    {numberOfRatings} {numberOfRatings === 1 ? 'rating' : 'ratings'}
                  </div>
                </>
              ) : (
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{title}</h2>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const ViewAllCard = ({ href, text = "View All" }: ViewAllCardProps) => (
  <Link href={href} className="shrink-0 w-80">
    <Card className="h-full transition-all duration-300 hover:shadow-lg flex items-center justify-center bg-gray-50 hover:bg-gray-50/80 border-gray-100">
      <div className="text-center py-8">
        <p className="text-gray-900 font-medium mb-2 text-lg">{text}</p>
        <ArrowRight className="mx-auto h-6 w-6 text-gray-500" />
      </div>
    </Card>
  </Link>
);

const HorizontalScrollSection = ({
  title,
  items,
  viewAllHref,
  viewAllText,
  variant
}: HorizontalScrollSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const [itemsPerView, setItemsPerView] = useState(3);
  const totalItems = viewAllHref ? items.length + 1 : items.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart.x - touchEnd.x;
    const minSwipeDistance = 50;
  
    if (Math.abs(distance) < minSwipeDistance) return;
  
    if (distance > 0 && currentIndex < maxIndex) {
      handleScroll('right');
    }
    if (distance < 0 && currentIndex > 0) {
      handleScroll('left');
    }
  
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Add this new useEffect
  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (isScrolling) return;

    setIsScrolling(true);
    const newIndex = direction === 'left'
      ? Math.max(0, currentIndex - 1)
      : Math.min(maxIndex, currentIndex + 1);

    setCurrentIndex(newIndex);

    setTimeout(() => {
      setIsScrolling(false);
    }, 500);
  };

  const getCurrentWidth = (width: { mobile: number; desktop: number }) => {
    // You can make this more sophisticated based on actual screen width
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return width.mobile;
    }
    return width.desktop;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const currentCardWidth = getCurrentWidth(CARD_WIDTH);
    const currentGap = getCurrentWidth(CARD_GAP);
    const targetScroll = currentIndex * (currentCardWidth + currentGap);
    container.style.transform = `translateX(-${targetScroll}px)`;
  }, [currentIndex]);

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-light text-gray-900">{title}</h2>
      </div>
      <div className="relative">
        <div 
          className="overflow-hidden pt-8 -mt-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={containerRef}
            className="flex gap-4 sm:gap-6 transition-transform duration-500 ease-in-out"
          >
            {items.map((item) => (
              <ScrollableCardItem
                key={item.id}
                href={item.href}
                title={item.title}
                subtitle={item.subtitle}
                value={item.value}
                imagePath={item.image_path}
                numberOfRatings={item.numberOfRatings}
                flavors={item.flavors}
                priceRange={item.price_range}
                cigarCount={item.cigarCount}
                variant={variant}
              />
            ))}
            {viewAllHref && <ViewAllCard href={viewAllHref} text={viewAllText} />}
          </div>
        </div>
  
        {/* Navigation Buttons - Hidden on mobile */}
        {currentIndex > 0 && (
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg border-gray-200 hover:bg-gray-100"
            onClick={() => handleScroll('left')}
            disabled={isScrolling}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
  
        {currentIndex < maxIndex && (
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg border-gray-200 hover:bg-gray-100"
            onClick={() => handleScroll('right')}
            disabled={isScrolling}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default HorizontalScrollSection;