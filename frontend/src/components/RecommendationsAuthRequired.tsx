import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const RecommendationsAuthRequired = () => {
  return (
    <div className="py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Personalized Recommendations</CardTitle>
          <CardDescription>
            Log in to discover cigars tailored to your taste
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4 text-center">
            <p className="text-gray-600">
              Our recommendation algorithm is based on each user's personal preferences. Log in and begin curating your humidor for access to this feature.
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
  );
};

export default RecommendationsAuthRequired;