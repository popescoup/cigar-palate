// src/app/verify-email/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const rawToken = searchParams.get('token');
        
        // Comprehensive debugging
        const logs = [];
        logs.push(`Raw token from URL: ${rawToken}`);
        logs.push(`Token length: ${rawToken ? rawToken.length : 0}`);
        
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
        
        setDebugInfo(logs);
        
        if (!token) {
          setStatus('error');
          setMessage('Verification token is missing');
          return;
        }

        logs.push(`Attempt ${attempts+1}: Sending verification request...`);
        console.log(logs.join('\n'));
        
        // Try with max 3 attempts
        setAttempts(prev => prev + 1);
        const response = await axios.post('/api/auth/verify-email', { token });
        
        setStatus('success');
        setMessage(response.data.message);
        
        // Redirect to home page after successful verification
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Verification failed';
        console.error('Verification error:', error);
        
        // Retry logic for up to 3 attempts
        if (attempts < 2) {
          console.log(`Retrying verification (attempt ${attempts+1}/3)...`);
          setDebugInfo(prev => [...prev, `⚠️ Attempt ${attempts+1} failed: ${errorMsg}`]);
          
          // Wait longer for each retry
          setTimeout(() => {
            verifyEmail();
          }, 1000 * (attempts + 1));
          return;
        }
        
        setStatus('error');
        setMessage(errorMsg);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'verifying' ? 
              `Verifying your email address${attempts > 0 ? ` (attempt ${attempts+1}/3)` : ''}...` : 
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
                <div className="mt-4 text-sm text-gray-500">
                  <details>
                    <summary>Troubleshooting information</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {debugInfo.join('\n')}
                    </pre>
                  </details>
                </div>
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="mt-4"
                >
                  Return to Login
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;