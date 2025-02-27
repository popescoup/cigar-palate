// components/AgeVerificationModal.tsx
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TermsViewer } from './TermsViewer';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerify: (verified: boolean) => void;
}

export const AgeVerificationModal = ({ isOpen, onVerify }: AgeVerificationModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleLeave = () => {
    onVerify(false);
    window.history.back();
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTerms(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <AlertDialog open={isOpen && !showTerms}>
        <AlertDialogContent className="max-w-md z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Age Verification & Terms Acceptance
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This website contains content related to tobacco products and is intended for adults only.
              </p>
              <p className="font-medium">
                By entering this site, you certify and agree to the following:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are of legal age to purchase tobacco products in your jurisdiction (21+ in the United States)</li>
                <li>You understand this site contains tobacco-related content</li>
                <li>You accept responsibility for verifying your age</li>
                <li>You have read and agree to our{' '}
                  <button 
                    onClick={handleTermsClick}
                    className="text-primary hover:underline font-medium"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                Click "I Accept" to confirm you meet the age requirements AND agree to our Terms of Service.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleLeave} className="w-full sm:w-auto">
              I Do Not Accept
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onVerify(true)} 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              I Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showTerms && <TermsViewer onClose={() => setShowTerms(false)} />}
    </>
  );
};