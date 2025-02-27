// components/Cigars/CigarsList/ListView/AlphabeticalList.tsx
import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import LetterGroup from './LetterGroup';

interface SimpleCigar {
  id: string;
  name: string;
}

interface AlphabeticalListProps {
  pages: Array<{
    cigars: SimpleCigar[];
  }>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

const AlphabeticalList: React.FC<AlphabeticalListProps> = ({
  pages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}) => {
  // Set up intersection observer for infinite scroll
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  // Flatten and group cigars by first letter
  const allCigars = pages.flatMap(page => page.cigars);
  const groupedCigars = allCigars.reduce((acc, cigar) => {
    const firstLetter = cigar.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(cigar);
    return acc;
  }, {} as Record<string, SimpleCigar[]>);

  // Get sorted letters
  const letters = Object.keys(groupedCigars).sort();

  // Split letters into two columns
  const midpoint = Math.ceil(letters.length / 2);
  const leftColumnLetters = letters.slice(0, midpoint);
  const rightColumnLetters = letters.slice(midpoint);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          {leftColumnLetters.map(letter => (
            <LetterGroup
              key={letter}
              letter={letter}
              cigars={groupedCigars[letter]}
            />
          ))}
        </div>

        {/* Right Column */}
        <div>
          {rightColumnLetters.map(letter => (
            <LetterGroup
              key={letter}
              letter={letter}
              cigars={groupedCigars[letter]}
            />
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div
        ref={ref}
        className="flex justify-center items-center py-4"
      >
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        )}
      </div>
    </div>
  );
};

export default AlphabeticalList;