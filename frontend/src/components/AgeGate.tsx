// components/AgeGate.tsx
'use client';

import { useAgeVerification } from '@/hooks/useAgeVerification';
import { AgeVerificationModal } from './AgeVerificationModal';

interface AgeGateProps {
  children: React.ReactNode;
}

export const AgeGate = ({ children }: AgeGateProps) => {
  const { showModal, handleVerification } = useAgeVerification();

  return (
    <>
      <AgeVerificationModal 
        isOpen={showModal} 
        onVerify={handleVerification} 
      />
      {children}
    </>
  );
};