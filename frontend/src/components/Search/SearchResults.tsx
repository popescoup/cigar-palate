// src/components/Search/SearchResults.tsx
'use client';
import React from 'react';
import { CigarResult, ForumResult, BrandResult, SearchResult } from '@/types/search';

interface SearchResultsProps {
    results: SearchResult[];
    query: string;
}

const CigarCard: React.FC<{ result: CigarResult }> = ({ result }) => (
    <li className="border p-6 rounded-lg shadow-md hover:shadow-lg transition">
        <a href={`/cigars/${result.id}`} className="block hover:no-underline">
            <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600 transition">{result.name}</h2>
            <p className="text-gray-600 mb-4">Brand: {result.brand || 'Unknown'}</p>
            
            {/* Description - Moved under brand name */}
            <p className="text-sm text-gray-700 mb-6">{result.description}</p>
            
            {/* Main Characteristics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="mb-1">
                        <span className="font-semibold">Flavors:</span> {
                            typeof result.flavors === 'string'
                                ? JSON.parse(result.flavors).join(', ')
                                : Array.isArray(result.flavors)
                                    ? result.flavors.join(', ')
                                    : result.flavors
                        }
                    </p>
                    <p className="mb-1"><span className="font-semibold">Strength:</span> {result.strength}</p>
                    <p className="mb-1"><span className="font-semibold">Price Range:</span> {result.price_range}</p>
                </div>
                <div>
                    <p className="mb-1">
                        <span className="font-semibold">Rating:</span> {result.averageRating.toFixed(1)}/100
                    </p>
                    <p className="mb-1">
                        <span className="font-semibold">Type:</span> {result.handmade ? 'Handmade' : 'Machine-made'}
                    </p>
                    <p className="mb-1"><span className="font-semibold">Origin:</span> {result.country_of_origin}</p>
                </div>
            </div>

            {/* Construction Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded">
                <div>
                    <p className="mb-1"><span className="font-semibold">Shape:</span> {result.shape}</p>
                    <p className="mb-1"><span className="font-semibold">Size:</span> {result.size}</p>
                    <p className="mb-1"><span className="font-semibold">Color:</span> {result.color}</p>
                    <p className="mb-1"><span className="font-semibold">Dimensions:</span> {result.dimensions}</p>
                    <p className="mb-1"><span className="font-semibold">Aging:</span> {result.aging} years</p>
                </div>
                <div>
                    <p className="mb-1"><span className="font-semibold">Wrapper:</span> {result.wrap_type}</p>
                    <p className="mb-1"><span className="font-semibold">Binder:</span> {result.binder}</p>
                    <p className="mb-1"><span className="font-semibold">Filler:</span> {result.filler}</p>
                    <p className="mb-1"><span className="font-semibold">Made By:</span> {result.made_by}</p>
                </div>
            </div>
        </a>
    </li>
);

const ForumCard: React.FC<{ result: ForumResult; query: string }> = ({ result, query }) => (
    <li className="border p-6 rounded-lg shadow-md hover:shadow-lg transition">
        <a href={`/forum/thread/${result.id}`} className="block hover:no-underline">
            <div>
                <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600 transition">
                    {result.title}
                </h2>
                <p className="text-gray-600 mb-2">
                    By: {result.user?.username || 'Anonymous'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {Array.isArray(result.tags) && result.tags.map((tag) => (
                        <span
                            key={tag}
                            onClick={(e) => {
                                e.preventDefault();
                                const encodedTag = encodeURIComponent(tag);
                                window.location.href = `/search?q=${query}&type=forum&tags=${encodedTag}`;
                            }}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition cursor-pointer"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <p className="mb-4 text-gray-700">
                    {result.content ? `${result.content.substring(0, 200)}...` : 'No content available'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{new Date(result.created_at).toLocaleDateString()}</span>
                    <span>• {result.replyCount || 0} replies</span>
                    <span>• {result.vote_count || 0} votes</span>
                </div>
            </div>
        </a>
    </li>
);

const BrandCard: React.FC<{ result: BrandResult }> = ({ result }) => (
    <li className="border p-6 rounded-lg shadow-md hover:shadow-lg transition">
        <a href={`/brands/${result.id}`} className="block hover:no-underline">
            <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600 transition">
                {result.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Average Rating: {result.averageRating.toFixed(1)}/100</span>
                <span>• {result.cigarCount} Cigars in Catalog</span>
            </div>
        </a>
    </li>
);

export const SearchResults: React.FC<SearchResultsProps> = ({ results, query }) => {
    console.log('SearchResults received:', { results, query });
    console.log('SearchResults component render:', {
        query,
        resultCount: results.length,
        resultTypes: results.map(r => r.resultType)
    });
    // Add debug logging
    results.forEach((result, index) => {
        if ('replyCount' in result) {
            console.log(`Forum result ${index} tags:`, result.tags);
        }
    });

    return (
        <ul className="space-y-6">
            {results.map((result) => {
                if ('brand' in result) {
                    return <CigarCard key={result.id} result={result as CigarResult} />;
                } else if ('replyCount' in result) {
                    return <ForumCard key={result.id} result={result as ForumResult} query={query} />;
                } else {
                    return <BrandCard key={result.id} result={result as BrandResult} />;
                }
            })}
        </ul>
    );
};