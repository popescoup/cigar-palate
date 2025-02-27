// components/Cigars/CigarsList/ListView/LetterGroup.tsx
import React from 'react';
import Link from 'next/link';

interface LetterGroupProps {
  letter: string;
  cigars: Array<{ id: string; name: string; }>;
}

const LetterGroup: React.FC<LetterGroupProps> = ({ letter, cigars }) => {
  if (cigars.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-3 text-gray-800">{letter}</h2>
      <div className="space-y-2">
        {cigars.map(cigar => (
          <Link
            key={cigar.id}
            href={`/cigars/${cigar.id}`}
            className="block text-gray-600 hover:text-gray-900 hover:underline"
          >
            {cigar.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LetterGroup;