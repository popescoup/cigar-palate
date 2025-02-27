// hooks/useInfiniteScroll.ts
import { useEffect, useRef, useState } from 'react';

export const useInfiniteScroll = (callback: () => void, hasMore: boolean) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!element) return;

    observer.current?.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    }, { threshold: 1.0 });

    observer.current.observe(element);

    return () => observer.current?.disconnect();
  }, [callback, element, hasMore]);

  return setElement;
};