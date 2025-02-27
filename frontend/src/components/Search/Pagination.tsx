// src/components/search/Pagination.tsx
import React from 'react';
import { PageNumber } from '@/types/search';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageNumbers: PageNumber[];
    buildUrl: (params: Record<string, string>) => string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    pageNumbers,
    buildUrl
}) => (
    <nav className="mt-8" aria-label="Search results pagination">
        <ul className="flex justify-center items-center gap-2">
            {currentPage > 1 && (
                <li>
                    <a
                        href={buildUrl({ page: (currentPage - 1).toString() })}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        aria-label="Previous page"
                    >
                        Previous
                    </a>
                </li>
            )}
            
            {pageNumbers.map((pageNum, index) => (
                <li key={index}>
                    {pageNum === '...' ? (
                        <span className="px-3 py-2">...</span>
                    ) : (
                        <a
                            href={buildUrl({ page: pageNum.toString() })}
                            className={`px-3 py-2 rounded transition ${
                                currentPage === pageNum
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            aria-current={currentPage === pageNum ? 'page' : undefined}
                        >
                            {pageNum}
                        </a>
                    )}
                </li>
            ))}

            {currentPage < totalPages && (
                <li>
                    <a
                        href={buildUrl({ page: (currentPage + 1).toString() })}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        aria-label="Next page"
                    >
                        Next
                    </a>
                </li>
            )}
        </ul>
    </nav>
);