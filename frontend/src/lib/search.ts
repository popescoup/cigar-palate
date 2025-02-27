// lib/search.ts
// lib/search.ts
import { SearchResponse, PageNumber, SearchResult } from '@/types/search';

const validateSearchParams = (params: {
    query: string,
    type: string,
    page: number,
    hitsPerPage: number,
    filters?: string,
    sort?: string,
    tags?: string[]
}): { isValid: boolean; error: string | null } => {
    // Validate search type
    const validTypes = ['all', 'cigars', 'forum', 'brands'];
    if (!validTypes.includes(params.type)) {
        return { isValid: false, error: 'Invalid search type' };
    }

    // Validate pagination
    if (params.page < 1 || params.page > 1000) {
        return { isValid: false, error: 'Invalid page number' };
    }
    if (params.hitsPerPage < 1 || params.hitsPerPage > 100) {
        return { isValid: false, error: 'Invalid results per page' };
    }

    // Validate sort parameter if provided
    if (params.sort) {
        const validSortOptions = ['relevance', 'date', 'rating'];
        if (!validSortOptions.includes(params.sort)) {
            return { isValid: false, error: 'Invalid sort option' };
        }
    }

    // Validate tags if provided
    if (params.tags?.length) {
        const MAX_TAG_LENGTH = 50;
        const validTagPattern = /^[a-zA-Z0-9-]+$/;
        const invalidTag = params.tags.find(tag => 
            tag.length > MAX_TAG_LENGTH || !validTagPattern.test(tag)
        );
        if (invalidTag) {
            return { isValid: false, error: 'Invalid tag format' };
        }
    }

    return { isValid: true, error: null };
};

export async function searchContent(
    query: string,
    type: 'all' | 'cigars' | 'forum' | 'brands' = 'all',
    filters?: string,
    sort?: string,
    page: number = 1,
    hitsPerPage: number = 20,
    tags?: string[]
): Promise<SearchResponse> {
    // Use environment variable instead of hardcoded URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const API_PATH = '/api/search';
    
    // Build search parameters
    const sanitizedParams = {
        query: query.trim(),
        type,
        page,
        hitsPerPage,
        filters,
        sort,
        tags
    };
    
    const { isValid, error } = validateSearchParams(sanitizedParams);
    if (!isValid) {
        throw new Error(error || 'Invalid search parameters');
    }
    
    const params = new URLSearchParams({
        q: sanitizedParams.query,
        type: sanitizedParams.type,
        page: sanitizedParams.page.toString(),
        hitsPerPage: sanitizedParams.hitsPerPage.toString()
    });

    if (type === 'cigars' && filters) {
        params.append('filters', filters);
    }

    if (sort) {
        params.append('sort', sort);
    }

    if (tags) {
        tags.forEach(tag => params.append('tags', tag));
    }

    // Construct full URL
    const fullUrl = `${BACKEND_URL}${API_PATH}?${params.toString()}`;
    
    console.log('Making search request:', {
        url: fullUrl,
        params: Object.fromEntries(params.entries())
    });

    try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
        const response = await fetch(fullUrl, { 
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
    
        clearTimeout(timeout);
    
        // Validate response size to prevent memory issues
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
            throw new Error('Response too large');
        }

        console.log('Response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', {
                status: response.status,
                text: errorText
            });
            throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('Raw API response:', data);  // Add this line
console.log('searchContent function response:', {
    query,
    type,
    hitCount: data.hits?.length,
    totalHits: data.totalHits,
    url: response.url  // Add this to see exact URL
});

        // Validate response structure
if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format');
}

// Sanitize response data
const sanitizedResponse = {
    hits: Array.isArray(data.hits) ? data.hits.map((hit: SearchResult) => ({
        ...hit,
        // Ensure no script tags or dangerous content in text fields
        title: 'title' in hit ? hit.title?.replace(/[<>]/g, '') : undefined,
        content: 'content' in hit ? hit.content?.replace(/[<>]/g, '') : undefined,
        description: 'description' in hit ? hit.description?.replace(/[<>]/g, '') : undefined
    })) : [],
    totalHits: Math.min(typeof data.totalHits === 'number' ? data.totalHits : 0, 10000), // Cap total hits
    currentPage: Math.min(typeof data.page === 'number' ? data.page : page, 1000), // Cap page number
    totalPages: Math.min(typeof data.totalPages === 'number' ? data.totalPages : 1, 1000), // Cap total pages
    hitsPerPage: Math.min(typeof data.hitsPerPage === 'number' ? data.hitsPerPage : hitsPerPage, 100) // Cap hits per page
};

return sanitizedResponse;
    } catch (error) {
        console.error('Search request failed:', error);
        throw error;
    }
}

export function getPageNumbers(current: number, total: number, maxPages: number = 5): PageNumber[] {
    if (total <= maxPages) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    let pages: PageNumber[] = [1];
    
    if (current > 3) {
        pages.push('...');
    }
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    
    if (current < total - 2) {
        pages.push('...');
    }
    
    pages.push(total);
    
    return pages;
}