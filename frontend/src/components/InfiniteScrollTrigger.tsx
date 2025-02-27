// components/InfiniteScrollTrigger.tsx
import React from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface Props {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const InfiniteScrollTrigger: React.FC<Props> = ({
  onIntersect,
  hasMore,
  isLoading
}) => {
  const setElement = useInfiniteScroll(onIntersect, hasMore);

  return (
    <div 
      ref={setElement} 
      className="w-full py-4 text-center"
    >
      {isLoading && hasMore ? (
        <div className="text-gray-500">Loading more...</div>
      ) : hasMore ? (
        <div className="text-gray-400">Scroll for more</div>
      ) : null}
    </div>
  );
};