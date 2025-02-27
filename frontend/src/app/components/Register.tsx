"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, CheckCircle } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface ValidationResponse {
  valid: boolean;
  message?: string;
}

const validateNameField = (value: string): { isValid: boolean; error: string | null } => {
  // Remove any HTML tags or special characters that could be used for XSS
  const sanitizedValue = value.replace(/[<>]/g, '').trim();
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const validNameRegex = /^[A-Za-z\s\-']+$/;
  
  if (value !== sanitizedValue) {
    return { 
      isValid: false, 
      error: 'Name contains invalid characters' 
    };
  }
  
  if (value.length > 50) {
    return { 
      isValid: false, 
      error: 'Name cannot exceed 50 characters' 
    };
  }
  
  if (value.trim().length > 0 && !validNameRegex.test(value)) {
    return { 
      isValid: false, 
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
    };
  }
  
  return { isValid: true, error: null };
};

const Register = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  const [fieldStatus, setFieldStatus] = useState<{
    username: 'idle' | 'checking' | 'valid' | 'invalid';
    email: 'idle' | 'checking' | 'valid' | 'invalid';
  }>({
    username: 'idle',
    email: 'idle',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    username: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  }>({
    username: null,
    email: null,
    firstName: null,
    lastName: null,
  });

  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptEmails, setAcceptEmails] = useState<boolean>(false);
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  // Field validation mutation
  const validateFieldMutation = useMutation({
    mutationFn: async ({ field, value }: { field: 'username' | 'email', value: string }) => {
      const { data } = await axios.post<ValidationResponse>(
        `/api/auth/validate-${field}`,
        { [field]: value }
      );
      return { field, data };
    },
    onMutate: ({ field }) => {
      setFieldStatus(prev => ({ ...prev, [field]: 'checking' }));
    },
    onSuccess: ({ field }) => {
      setFieldStatus(prev => ({ ...prev, [field]: 'valid' }));
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    },
    onError: (error: any, { field }) => {
      setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
      setFieldErrors(prev => ({
        ...prev,
        [field]: error.response?.data?.message || 'Validation failed'
      }));
    }
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post(
        '/api/auth/register',
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName || null,
          acceptEmails,
        },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      setVerificationSent(true);
      setRegisteredEmail(formData.email);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
      });
      setAcceptTerms(false);
      setAcceptEmails(false);
    }
  });

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        '/api/auth/resend-verification',
        { email: registeredEmail }
      );
      return response.data;
    }
  });

  const validateField = (field: 'username' | 'email', value: string) => {
    if (!value) {
      setFieldStatus(prev => ({ ...prev, [field]: 'idle' }));
      return;
    }

    queryClient.cancelQueries({ queryKey: [`validate-${field}`] });
    setTimeout(() => {
      validateFieldMutation.mutate({ field, value });
    }, 500);
  };

  const checkPasswordStrength = (pass: string): void => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^A-Za-z0-9]/)) score++;
    setPasswordStrength(score);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    if (name === 'username' || name === 'email') {
      validateField(name as 'username' | 'email', value);
    }
  
    if (name === 'firstName' || name === 'lastName') {
      const { isValid, error } = validateNameField(value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
  
    if (fieldErrors.username || fieldErrors.email || fieldErrors.firstName || fieldErrors.lastName) {
      return;
    }
  
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.firstName) {
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return;
    }
  
    if (formData.password !== formData.confirmPassword) {
      return;
    }
  
    if (formData.password.length < 8) {
      return;
    }
  
    if (!acceptTerms) {
      return;
    }
  
    registerMutation.mutate(formData);
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

  if (verificationSent) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to {registeredEmail}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Please check your email and click the verification link to complete your registration.
            The link will expire in 24 hours.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or:
            </p>
            <Button 
              onClick={() => resendVerificationMutation.mutate()}
              variant="outline" 
              disabled={resendVerificationMutation.isPending}
              className="w-full"
            >
              {resendVerificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          </div>

          {resendVerificationMutation.isSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Verification email has been resent. Please check your inbox.</AlertDescription>
            </Alert>
          )}

          {resendVerificationMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>Failed to resend verification email. Please try again.</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-sm text-gray-500">
          <p>
            Ready to log in? <a href="/login" className="text-blue-500 hover:underline">Sign in</a>
          </p>
        </CardFooter>
      </Card>
    );
  }

  const strengthText = getPasswordStrengthText();

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Join our community of cigar enthusiasts and start your journey today.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
  <Label htmlFor="firstName">First Name *</Label>
  <Input
    id="firstName"
    name="firstName"
    value={formData.firstName}
    onChange={onChange}
    placeholder="John"
    disabled={registerMutation.isPending}
    className={`${fieldErrors.firstName ? 'border-red-500' : ''}`}
    required
  />
  {fieldErrors.firstName && (
    <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
  )}
</div>

<div className="space-y-2">
  <Label htmlFor="lastName">Last Name (Optional)</Label>
  <Input
    id="lastName"
    name="lastName"
    value={formData.lastName}
    onChange={onChange}
    placeholder="Doe"
    disabled={registerMutation.isPending}
    className={`${fieldErrors.lastName ? 'border-red-500' : ''}`}
  />
  {fieldErrors.lastName && (
    <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
  )}
</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <div className="relative">
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={onChange}
                placeholder="Choose a unique username"
                disabled={registerMutation.isPending}
                className={`${fieldErrors.username ? 'border-red-500' : ''} pr-10`}
                required
              />
              <div className="absolute right-3 top-[50%] -translate-y-[50%] flex items-center h-full pointer-events-none">
                {fieldStatus.username === 'checking' && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
                {fieldStatus.username === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {fieldStatus.username === 'invalid' && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {fieldErrors.username && (
              <p className="text-xs text-red-500">{fieldErrors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
                placeholder="you@example.com"
                disabled={registerMutation.isPending}
                className={`${fieldErrors.email ? 'border-red-500' : ''} pr-10`}
                required
              />
              <div className="absolute right-3 top-[50%] -translate-y-[50%] flex items-center h-full pointer-events-none">
                {fieldStatus.email === 'checking' && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
                {fieldStatus.email === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {fieldStatus.email === 'invalid' && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={onChange}
              disabled={registerMutation.isPending}
              required
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
                <span className={`ml-1 font-medium ${strengthText.color}`}>
                  {strengthText.text}
                </span>
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters and include uppercase, numbers, and special characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={onChange}
              disabled={registerMutation.isPending}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked: boolean) => setAcceptTerms(checked)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I accept the{" "}
                <a 
                  href="/terms" 
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a 
                  href="/privacy" 
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailPreferences"
                checked={acceptEmails}
                onCheckedChange={(checked: boolean) => setAcceptEmails(checked)}
              />
              <label
                htmlFor="emailPreferences"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I would like to receive emails for notifications, personalized recommendations, and special offers
              </label>
            </div>
          </div>

          {registerMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(registerMutation.error as any)?.response?.data?.message || 'An error occurred during registration. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {registerMutation.isSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Registration successful! Please check your email to verify your account.</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={registerMutation.isPending || validateFieldMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-sm text-gray-500">
        <p>
          Already have an account? <a href="/login" className="text-blue-500 hover:underline">Sign in</a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default Register;
                  