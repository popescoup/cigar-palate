// app/search/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { ContentTypeSelector } from '@/components/Search/ContentTypeSelector';
import { FilterSection } from '@/components/Search/FilterSection';
import { SortSection } from '@/components/Search/SortSection';
import { SearchResults } from '@/components/Search/SearchResults';
import { Pagination } from '@/components/Search/Pagination';
import { searchContent, getPageNumbers } from '@/lib/search';
import { 
   cigarFilterOptions, 
   cigarSortOptions, 
   forumSortOptions,
   brandSortOptions
} from '@/lib/searchOptions';

export const metadata: Metadata = {
   title: 'Search Results',
   description: 'Search results for cigars and forum content',
};

export default async function SearchPage({
   searchParams,
}: {
   searchParams: {
       q: string;
       type?: 'all' | 'cigars' | 'forum' | 'brands';
       filters?: string;
       sort?: string;
       page?: string;
       tags?: string | string[];
   };
}) {
   console.log('SearchPage executing with params:', searchParams);
   
   const { q: query, type = 'all', filters, sort, page = '1', tags } = searchParams;
   console.log('Destructured search params:', { query, type, filters, sort, page, tags });
   const currentPage = parseInt(page, 10);
   const hitsPerPage = 20;
   const processedTags = typeof tags === 'string' ? [tags] : tags;

   // Parse active filters into array
   const activeFilters = filters ? filters.split(',').filter(Boolean) : [];

   const { hits: results, totalHits, totalPages } = await searchContent(
       query,
       type,
       filters,
       sort,
       currentPage,
       hitsPerPage,
       processedTags
   );

   console.log('SearchPage received results:', {
    query,
    type,
    resultCount: results.length,
    totalHits
});

   // Only show filter options for cigars type
   const filterOptions = type === 'cigars' ? cigarFilterOptions : [];
   
   const sortOptions = 
       type === 'all' ? [] : 
       type === 'cigars' ? cigarSortOptions :
       type === 'forum' ? forumSortOptions :
       type === 'brands' ? brandSortOptions :
       [];

   const buildUrl = (params: Record<string, string>) => {
       // Clear existing parameters if switching content type
       console.log('buildUrl called with params:', params);
       if ('type' in params && params.type !== type) {
           const newParams = new URLSearchParams();
           newParams.set('q', query);
           newParams.set('type', params.type);
           newParams.set('page', '1');
           return `/search?${newParams.toString()}`;
       }

       const urlParams = new URLSearchParams(searchParams as Record<string, string>);
       
       // Handle price range filter
       if ('filters' in params) {
           if (params.filters) {
               urlParams.set('filters', params.filters);
           } else {
               urlParams.delete('filters');
           }
       }
       
       if ('sort' in params) {
           if (params.sort) {
               urlParams.set('sort', params.sort);
           } else {
               urlParams.delete('sort');
           }
       }

       // Handle other params
       Object.entries(params).forEach(([key, value]) => {
           if (key !== 'filters' && key !== 'sort') {
               if (value) {
                   urlParams.set(key, value);
               } else {
                   urlParams.delete(key);
               }
           }
       });

       return `/search?${urlParams.toString()}`;
   };

   const pageNumbers = getPageNumbers(currentPage, totalPages);

   // Calculate result range for display
   const resultStart = ((currentPage - 1) * hitsPerPage) + 1;
   const resultEnd = Math.min(currentPage * hitsPerPage, totalHits);

   return (
       <div className="container mx-auto px-4 py-8">
           <h1 className="text-3xl font-bold mb-4">
               {type === 'all' 
                   ? 'Search Results' 
                   : `${
                       type === 'cigars' 
                           ? 'Cigar' 
                           : type === 'forum' 
                               ? 'Forum' 
                               : 'Brand'
                   } Results`}
           </h1>
           
           <div className="mb-4">
               <p>You searched for: <span className="font-semibold">{query}</span></p>
           </div>

           <ContentTypeSelector currentType={type} buildUrl={buildUrl} />

           {filterOptions.length > 0 && (
    <FilterSection 
        filterOptions={filterOptions} 
        activeFilters={activeFilters}
    />
)}

           {sortOptions.length > 0 && (
               <SortSection 
                   sortOptions={sortOptions} 
                   currentSort={sort}
                   searchParams={searchParams as Record<string, string>}
                   baseUrl="/search"
               />
           )}

           <div className="mb-4 flex justify-between items-center">
               <p>
                   {totalHits > 0 ? (
                       `Showing ${resultStart} to ${resultEnd} of ${totalHits} results`
                   ) : (
                       'No results found'
                   )}
               </p>
               {totalPages > 1 && (
                   <p>Page {currentPage} of {totalPages}</p>
               )}
           </div>

           {results.length > 0 ? (
               <SearchResults results={results} query={query} />
           ) : (
               <div className="text-center py-8">
                   <p className="text-lg text-gray-600">No results found. Try:</p>
                   <ul className="mt-2 text-gray-600">
                       <li>• Using different keywords</li>
                       <li>• Removing filters</li>
                       <li>• Checking for typos</li>
                   </ul>
               </div>
           )}

           {totalPages > 1 && (
               <Pagination
                   currentPage={currentPage}
                   totalPages={totalPages}
                   pageNumbers={pageNumbers}
                   buildUrl={buildUrl}
               />
           )}
       </div>
   );
}