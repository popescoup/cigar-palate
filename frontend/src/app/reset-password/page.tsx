// src/app/reset-password/page.tsx
import { Suspense } from 'react';
import ResetPasswordClient from './reset-password-client';

export const metadata = {
  title: 'Reset Password - CigarPalate.com',
  description: 'Reset your CigarPalate.com account password.'
};

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen p-10 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Reset Password</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Please enter your new password below.
      </p>

      <div className="w-full max-w-lg">
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordClient />
        </Suspense>
      </div>
    </div>
  );
};

export default ResetPasswordPage;