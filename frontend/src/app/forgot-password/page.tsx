// src/app/forgot-password/page.tsx
import ForgotPassword from '../components/ForgotPassword';

export const metadata = {
  title: 'Forgot Password - Brotherhood of The Leaf',
  description: 'Reset your password to regain access to your Brotherhood of The Leaf account.'
};

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen p-10 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Forgot Password</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Don't worry! Enter your email address and we'll send you instructions to reset your password.
      </p>

      <div className="w-full max-w-lg">
        <ForgotPassword />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;