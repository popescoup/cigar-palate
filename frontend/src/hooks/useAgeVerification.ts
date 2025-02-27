// hooks/useAgeVerification.ts
import { useState, useEffect } from 'react';

const AGE_VERIFICATION_KEY = 'age-verified';

export const useAgeVerification = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkAgeVerification = () => {
      const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
      if (!verified) {
        setShowModal(true);
      }
    };

    checkAgeVerification();
  }, []);

  const handleVerification = (isVerified: boolean) => {
    if (isVerified) {
      localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
    }
    setShowModal(false);
  };

  return {
    showModal,
    handleVerification
  };
};