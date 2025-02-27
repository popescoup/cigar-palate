// src/app/auth-required/page.tsx
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const AuthRequiredPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              Join our community to contribute to our cigar database
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-gray-600">
                To contribute to our cigar database and submit new cigars, you'll need to be part of our community. 
                Please sign in to your account or create one if you haven't already.
              </p>
              
              <div className="pt-4 space-y-3">
                <Link href="/login">
                  <Button className="w-full">
                    Sign In
                  </Button>
                </Link>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>Don't have an account?</span>
                  <Link 
                    href="/register" 
                    className="text-blue-500 hover:underline font-medium"
                  >
                    Create one
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-gray-100 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors duration-200">
              Return to Home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthRequiredPage;