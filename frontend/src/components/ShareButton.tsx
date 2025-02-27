import React, { useState } from 'react';
import { Share2, Copy, CheckCheck, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import type { Cigar } from '@/types/cigars';
import Head from 'next/head';

interface ShareButtonProps {
  cigar: Cigar;
}

const ShareButton: React.FC<ShareButtonProps> = ({ cigar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const imageUrl = cigar.image_path 
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${cigar.image_path}`
  : '/placeholder-cigar.jpg';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* Open Graph Meta Tags - Add these to your page head */}
      <Head>
        <meta property="og:title" content={`${cigar.name} by ${cigar.brand?.name || 'Unknown Brand'}`} />
        <meta property="og:description" content={`Explore ${cigar.name} and discover your next favorite cigar on our community-driven platform. Join us to rate, review, and share your cigar experiences.`} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${cigar.name} by ${cigar.brand?.name || 'Unknown Brand'}`} />
        <meta name="twitter:description" content={`Explore ${cigar.name} and discover your next favorite cigar on our community-driven platform. Join us to rate, review, and share your cigar experiences.`} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>

      {/* Share Button - Styled to match CigarHero design */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Share cigar"
      >
        <Share2 className="w-6 h-6 text-gray-400 hover:text-primary" />
      </button>

      {/* Share Dialog */}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-0 top-0 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <AlertDialogHeader>
              <AlertDialogTitle>Share {cigar.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Copy the link below to share this cigar with others
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="flex items-center gap-2 p-2 mt-4 bg-gray-100 rounded-md">
              <div className="flex-1 overflow-hidden text-sm text-gray-600 truncate">
                {url}
              </div>
              <button
                onClick={handleCopy}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Copy link"
              >
                {copied ? (
                  <CheckCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ShareButton;