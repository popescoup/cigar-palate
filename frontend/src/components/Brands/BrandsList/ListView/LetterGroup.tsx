// components/Brands/BrandsList/ListView/LetterGroup.tsx
import React from 'react';
import Link from 'next/link';

interface LetterGroupProps {
  letter: string;
  brands: Array<{ id: string | number; name: string; }>;
}

const LetterGroup: React.FC<LetterGroupProps> = ({ letter, brands }) => {
  if (brands.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-3 text-gray-800">{letter}</h2>
      <div className="space-y-2">
        {brands.map(brand => (
          <Link
            key={brand.id}
            href={`/brands/${brand.id}`}
            className="block text-gray-600 hover:text-gray-900 hover:underline"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LetterGroup;