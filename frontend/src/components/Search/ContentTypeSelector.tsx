// components/Search/ContentTypeSelector.tsx
import React from 'react';

interface ContentTypeSelectorProps {
    currentType: 'all' | 'cigars' | 'forum' | 'brands';
    buildUrl: (params: Record<string, string>) => string;
}

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({ currentType, buildUrl }) => {
    const buildTypeUrl = (newType: string) => {
        return buildUrl({ 
            type: newType, 
            page: '1',
            filters: '', // Clear filters when changing type
            sort: ''    // Clear sort when changing type
        });
    };

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Content Type</h2>
            <div className="flex gap-2">
                {[
                    { type: 'all', label: 'All Results' },
                    { type: 'cigars', label: 'Cigars' },
                    { type: 'brands', label: 'Brands' },
                    { type: 'forum', label: 'Forum Posts' }
                ].map(({ type, label }) => (
                    <a
                        key={type}
                        href={buildTypeUrl(type)}
                        className={`px-3 py-1 rounded-full transition ${
                            currentType === type 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-black hover:bg-gray-200'
                        }`}
                    >
                        {label}
                    </a>
                ))}
            </div>
        </div>
    );
};