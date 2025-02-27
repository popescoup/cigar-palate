// components/ui/pagination.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}) => {
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const pagesToShow = 2; // Number of pages to show before and after current page

    // Helper function to add pages without duplicates
    const addPage = (page: number) => {
      if (!pages.includes(page)) {
        pages.push(page);
      }
    };

    // Always add first page
    addPage(1);

    // Calculate range around current page
    for (let i = Math.max(2, currentPage - pagesToShow); i <= Math.min(totalPages - 1, currentPage + pagesToShow); i++) {
      if (pages[pages.length - 1] !== i - 1 && pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
      addPage(i);
    }

    // Add last page if not already included
    if (totalPages !== 1) {
      if (pages[pages.length - 1] !== totalPages - 1 && pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
      addPage(totalPages);
    }

    return pages;
  };

  return (
    <div className={cn("flex justify-center items-center space-x-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-gray-600"
              >
                ...
              </span>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "min-w-[32px]",
                currentPage === page && "pointer-events-none"
              )}
              onClick={() => onPageChange(page)}
              disabled={currentPage === page}
            >
              {page}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;