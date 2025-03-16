// src/app/verify-email/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const verifyEmail = async () => {
      // Initialize logs array
      const logs = [];
      
      try {
        // Get token from URL
        const rawToken = searchParams.get('token');
        logs.push(`Raw token from URL: ${rawToken}`);
        logs.push(`Token length: ${rawToken ? rawToken.length : 0}`);
        
        // Add domain/protocol logging
        logs.push(`Current URL: ${window.location.href}`);
        logs.push(`Origin: ${window.location.origin}`);
        logs.push(`Protocol: ${window.location.protocol}`);
        logs.push(`Host: ${window.location.host}`);
        
        // Check for mixed content issues
        if (window.location.protocol === 'https:' && 
            document.referrer && 
            document.referrer.startsWith('http:')) {
          logs.push('⚠️ WARNING: Secure page loaded from insecure referrer');
        }
        
        // Check for cookie issues
        logs.push(`Has cookies: ${document.cookie.length > 0 ? 'Yes' : 'No'}`);
          
        // Check for URL encoding issues
        let token = rawToken;
        try {
          const decodedToken = decodeURIComponent(rawToken || '');
          logs.push(`URL-decoded token: ${decodedToken}`);
          logs.push(`Decoded token length: ${decodedToken.length}`);
          
          // If decoding changes the token, there might be encoding issues
          if (decodedToken !== rawToken) {
            logs.push('⚠️ Token was URL-encoded - using decoded version');
            token = decodedToken;
          }
        } catch (e) {
          logs.push(`Error decoding token: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        // Update debug info state
        setDebugInfo(logs);
        console.log('Debug info:', logs.join('\n'));
        
        if (!token) {
          setStatus('error');
          setMessage('Verification token is missing');
          return;
        }

        logs.push('Sending verification request...');
        
        // Make the API request
        try {
          const response = await axios.post('/api/auth/verify-email', { token });
          
          // Update state with success
          logs.push('Verification request succeeded');
          logs.push(`Server response: ${JSON.stringify(response.data)}`);
          setDebugInfo(logs); // Update debug info
          
          setStatus('success');
          setMessage(response.data.message);
          
          // Redirect to home page after successful verification
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        } catch (verifyError: any) {
          logs.push(`Initial verification request failed: ${verifyError.response?.status}`);
          logs.push(`Error details: ${JSON.stringify(verifyError.response?.data || {})}`);
          
          // Even if verification API call failed, check auth status to see if actually verified
          logs.push('Checking auth status as fallback...');
          try {
            const authStatusResponse = await axios.get('/api/auth/status');
            logs.push(`Auth status response: ${JSON.stringify(authStatusResponse.data)}`);
            
            if (authStatusResponse.data.isLoggedIn) {
              logs.push('User is logged in according to auth status - verification likely succeeded');
              setStatus('success');
              setMessage('Your account has been verified successfully! You are now logged in.');
              
              // Redirect to home page after successful verification
              setTimeout(() => {
                router.push('/');
              }, 3000);
              return;
            } else {
              logs.push('User is not logged in according to auth status - verification truly failed');
            }
          } catch (statusError) {
            logs.push(`Error checking auth status: ${statusError instanceof Error ? statusError.message : String(statusError)}`);
          }
          
          // If we get here, both verification and auth check failed
          throw verifyError;
        }
      } catch (error: any) {
        // Handle errors
        const errorMsg = error.response?.data?.message || 'Verification failed';
        logs.push(`Verification error: ${errorMsg}`);
        
        if (error.response) {
          logs.push(`Response status: ${error.response.status}`);
          logs.push(`Response headers: ${JSON.stringify(error.response.headers)}`);
        }
        
        // Update debug info
        setDebugInfo(logs);
        console.error('Verification error:', error);
        
        setStatus('error');
        setMessage(errorMsg);
      }
    };

    if (searchParams.get('token')) {
      verifyEmail();
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'verifying' ? 
              'Verifying your email address...' : 
              status === 'success' ? 'Email verified successfully!' :
              'Verification failed'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            {status === 'verifying' && (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p>Please wait while we verify your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <p className="text-sm text-gray-500">
                  Redirecting you to the home page...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-8 w-8 text-red-500" />
                <Alert variant="destructive">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <div className="mt-4 space-y-2">
                  <details className="text-sm text-gray-500">
                    <summary>Troubleshooting information</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {debugInfo.join('\n')}
                    </pre>
                  </details>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full"
                    >
                      Return to Login
                    </Button>
                    <Button
                      onClick={() => router.push('/resend-verification')}
                      variant="outline"
                      className="w-full"
                    >
                      Resend Verification
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;