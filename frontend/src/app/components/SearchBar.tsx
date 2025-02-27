// SearchBar.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export const validateSearchQuery = (query: string): { isValid: boolean; error: string | null } => {
  // Remove any HTML tags or script injection attempts
  const sanitizedValue = query.replace(/[<>]/g, '').trim();
  
  // Check for maximum length (prevent DoS via extremely long queries)
  const MAX_QUERY_LENGTH = 100;
  
  if (query !== sanitizedValue) {
    return {
      isValid: false,
      error: 'Search query contains invalid characters'
    };
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return {
      isValid: false,
      error: `Search query cannot exceed ${MAX_QUERY_LENGTH} characters`
    };
  }

  // Check for common SQL injection patterns
  const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|union|exec|declare)\b)|(['";])/i;
  if (sqlInjectionPattern.test(query)) {
    return {
      isValid: false,
      error: 'Invalid search query'
    };
  }

  return { isValid: true, error: null };
};

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setError('Please enter a search term');
      return;
    }
  
    const { isValid, error } = validateSearchQuery(trimmedQuery);
    
    if (!isValid) {
      setError(error);
      return;
    }
  
    const searchUrl = `/search?q=${encodeURIComponent(trimmedQuery)}&type=all`;
    router.push(searchUrl);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col w-full">
      <div className="flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (value.trim()) {
              const { error } = validateSearchQuery(value);
              setError(error);
            } else {
              setError(null);
            }
          }}
          placeholder="Search cigars and discussions..."
          maxLength={100}
          className={`px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black placeholder-gray-500 flex-1`}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Search
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </form>
  );
};

export default SearchBar;