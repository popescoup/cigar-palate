// components/ResetPassword.tsx
"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';  // Changed from 'next/router' to 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const ResetPassword = ({ token }: { token: string }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const checkPasswordStrength = (pass: string): void => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^A-Za-z0-9]/)) score++;
    setPasswordStrength(score);
  };

  const getPasswordStrengthText = (): { text: string; color: string } => {
    switch (passwordStrength) {
      case 0:
        return { text: 'Very Weak', color: 'text-red-500' };
      case 1:
        return { text: 'Weak', color: 'text-orange-500' };
      case 2:
        return { text: 'Medium', color: 'text-yellow-500' };
      case 3:
        return { text: 'Strong', color: 'text-lime-500' };
      case 4:
        return { text: 'Very Strong', color: 'text-green-500' };
      default:
        return { text: 'Very Weak', color: 'text-red-500' };
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
  
    if (!formData.password.match(/[A-Z]/)) {
      setError('Password must include at least one uppercase letter');
      return;
    }
  
    if (!formData.password.match(/[0-9]/)) {
      setError('Password must include at least one number');
      return;
    }
  
    if (!formData.password.match(/[^A-Za-z0-9]/)) {
      setError('Password must include at least one special character');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/auth/reset-password', {
        token,
        newPassword: formData.password
      });
      
      setMessage('Password successfully reset! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired reset token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          Please enter your new password below.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
  <Label htmlFor="password">New Password</Label>
  <Input
    id="password"
    type="password"
    value={formData.password}
    onChange={(e: ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, password: e.target.value });
      checkPasswordStrength(e.target.value);
    }}
    disabled={loading}
  />
  <div className="flex gap-1 mt-1">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`h-1 w-full rounded ${
          i < passwordStrength
            ? 'bg-green-500'
            : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
  <div className="flex justify-between text-xs">
    <p className="text-gray-500">
      Password strength:
      <span className={`ml-1 font-medium ${getPasswordStrengthText().color}`}>
        {getPasswordStrengthText().text}
      </span>
    </p>
  </div>
  <p className="text-xs text-gray-500">
    Password must be at least 8 characters and include uppercase, numbers, and special characters
  </p>
</div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;