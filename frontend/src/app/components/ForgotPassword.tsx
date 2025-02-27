// components/ForgotPassword.tsx
"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const validateEmail = (email: string): { isValid: boolean; error: string | null } => {
  // Remove any HTML tags or special characters that could be used for XSS
  const sanitizedValue = email.replace(/[<>]/g, '').trim();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email !== sanitizedValue) {
    return {
      isValid: false,
      error: 'Email contains invalid characters'
    };
  }
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }
  
  if (email.length > 254) { // Standard email length limit
    return {
      isValid: false,
      error: 'Email address is too long'
    };
  }
  
  return { isValid: true, error: null };
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
  
    if (!email) {
      setError('Email is required');
      return;
    }
  
    const { isValid, error } = validateEmail(email);
    if (!isValid) {
      setError(error);
      return;
    }
  
    try {
      setLoading(true);
      await axios.post('/api/auth/forgot-password', { email });
      setMessage('If an account exists with this email, you will receive password reset instructions shortly.');
    } catch (err) {
      // Don't reveal if the email exists or not for security
      setMessage('If an account exists with this email, you will receive password reset instructions shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you instructions to reset your password.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
  id="email"
  type="email"
  value={email}
  onChange={(e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    const { error } = validateEmail(value);
    setError(error);
  }}
  placeholder="you@example.com"
  disabled={loading}
  className={`${error ? 'border-red-500' : ''}`}
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
                Sending...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </Button>

          <p className="text-center text-sm">
            <a href="/login" className="text-blue-500 hover:underline">
              Back to Login
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;