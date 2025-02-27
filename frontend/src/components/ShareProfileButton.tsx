import React, { useState } from 'react';
import { Share2, Copy, CheckCheck, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface ShareProfileButtonProps {
  username: string;
}

const ShareProfileButton: React.FC<ShareProfileButtonProps> = ({ username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/profile/${username}`
    : '';

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
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Share profile"
      >
        <Share2 className="w-6 h-6 text-gray-400 hover:text-primary" />
      </button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md">
          <div className="relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-0 top-0 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <AlertDialogHeader>
              <AlertDialogTitle>Share {username}'s Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Copy the link below to share this profile with others
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

export default ShareProfileButton;