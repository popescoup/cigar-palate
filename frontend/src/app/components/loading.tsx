// app/components/loading.tsx
'use client';

import { Suspense } from 'react';
import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  isGlobal?: boolean;
  delay?: number;
}

const sizeClasses = {
  sm: "h-4 w-4 sm:h-6 sm:w-6",
  md: "h-6 w-6 sm:h-8 sm:w-8",
  lg: "h-8 w-8 sm:h-10 sm:w-10"
};

// Separate the content that uses useSearchParams
function LoadingSpinnerContent({
  size = 'md',
  isGlobal = false,
  delay = 50
}: LoadingSpinnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const navigationStartTime = useRef<number>(0);

  // Function to start loading state
  const startLoading = useCallback(() => {
    setLoading(true);
    navigationStartTime.current = Date.now();
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set timeout to show spinner after delay
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setShouldShow(true);
      }
    }, delay);
  }, [delay, loading]);

  // Function to stop loading state
  const stopLoading = useCallback(() => {
    setLoading(false);
    setShouldShow(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isGlobal) return;

    // Start loading on navigation change
    startLoading();

    // Navigation completed
    const navigationTime = Date.now() - navigationStartTime.current;
    if (navigationTime < delay) {
      // If navigation was faster than delay, don't show spinner
      stopLoading();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams, isGlobal, delay, startLoading, stopLoading]);

  // Register navigation state observers
  useEffect(() => {
    if (!isGlobal) return;

    const handleStart = () => {
      startLoading();
    };

    const handleStop = () => {
      stopLoading();
    };

    // Add event listeners for navigation
    window.addEventListener('beforeunload', handleStart);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleStop();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleStart);
    };
  }, [isGlobal, startLoading, stopLoading]);

  if (!isGlobal || !loading || !shouldShow) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-background/80 rounded-lg p-4">
      <Loader2 
        className={`${sizeClasses[size]} animate-spin text-gray-500`} 
      />
    </div>
  );
}

// Main export wrapped in Suspense
export default function LoadingSpinner(props: LoadingSpinnerProps) {
  return (
    <Suspense fallback={null}>
      <LoadingSpinnerContent {...props} />
    </Suspense>
  );
}