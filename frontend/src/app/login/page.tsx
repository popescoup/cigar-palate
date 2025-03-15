import type { Metadata } from 'next';
import Login from '../components/Login';

export const metadata: Metadata = {
  title: 'Login - CigarPalate.com',
  description: 'Log into your account to access the best cigars and community features on CigarPalate.com.',
};

export default function LoginPage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-6">Login</h1>
      <p className="mb-4">
        Access your account to continue exploring premium cigars and engaging with our community.
      </p>

      <div className="max-w-lg mx-auto">
        <Login />
      </div>
    </div>
  );
}