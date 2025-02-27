"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginResponse {
  requiresVerification?: boolean;
  email?: string;
  message?: string;
}

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

const Login = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post<LoginResponse>(
        '/api/auth/login',
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    },
    onError: (error: any) => {
      if (error.response?.data?.requiresVerification) {
        setUnverifiedEmail(error.response.data.email);
        setShowResendVerification(true);
      }
    }
  });

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await axios.post(
        '/api/auth/resend-verification',
        { email }
      );
      return response.data;
    },
    onSuccess: () => {
      setShowResendVerification(false);
    }
  });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? e.target.checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    if (name === 'email') {
      const { error } = validateEmail(value);
      setValidationError(error);
    }
  };

  const resendVerification = async () => {
    if (unverifiedEmail) {
      resendVerificationMutation.mutate(unverifiedEmail);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const { email, password } = formData;
  
    if (!email || !password) {
      setValidationError('Email and password are required');
      return;
    }
  
    const { isValid, error } = validateEmail(email);
    if (!isValid) {
      setValidationError(error);
      return;
    }
  
    loginMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Log in to your account to access your personalized cigar experience.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    name="email"
    type="email"
    value={formData.email}
    onChange={onChange}
    placeholder="you@example.com"
    disabled={loginMutation.isPending}
    className={`${validationError ? 'border-red-500' : ''}`}
  />
  {validationError && (
    <p className="text-xs text-red-500">{validationError}</p>
  )}
</div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <a 
                href="/forgot-password" 
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={onChange}
              disabled={loginMutation.isPending}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked: boolean) => 
                setFormData(prev => ({ ...prev, rememberMe: checked }))
              }
            />
            <label
              htmlFor="rememberMe"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>

          {showResendVerification && (
            <div className="space-y-2">
              <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                <AlertDescription>
                  Your email address hasn't been verified yet. Please check your inbox or click below to resend the verification email.
                </AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resendVerification}
                disabled={resendVerificationMutation.isPending}
              >
                {resendVerificationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending verification email...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
            </div>
          )}

          {(loginMutation.isError || resendVerificationMutation.isError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginMutation.isError 
                  ? (loginMutation.error as any)?.response?.data?.message || 'Failed to login. Please try again.'
                  : 'Failed to resend verification email. Please try again.'
                }
              </AlertDescription>
            </Alert>
          )}

          {(loginMutation.isSuccess || resendVerificationMutation.isSuccess) && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {loginMutation.isSuccess 
                  ? 'Login successful! Redirecting...'
                  : 'Verification email has been resent. Please check your inbox.'
                }
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-sm text-gray-500">
        <p>Don't have an account? <a href="/register" className="text-blue-500 hover:underline">Create one</a></p>
      </CardFooter>
    </Card>
  );
};

export default Login;