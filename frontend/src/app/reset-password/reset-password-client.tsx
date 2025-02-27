// src/app/reset-password/reset-password-client.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import ResetPassword from '../components/ResetPassword';

const ResetPasswordClient = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Invalid Reset Link! </strong>
        <span className="block sm:inline">
          This password reset link appears to be invalid or has expired. Please request a new password reset link.
        </span>
        <div className="mt-4">
          <a 
            href="/forgot-password" 
            className="text-red-700 underline hover:text-red-800"
          >
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  return <ResetPassword token={token} />;
};

export default ResetPasswordClient;