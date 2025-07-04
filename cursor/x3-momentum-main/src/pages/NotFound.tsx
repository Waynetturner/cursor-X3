
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const currentPath = window.location.pathname;
  
  // Log when NotFound component renders
  console.log('=== NOT FOUND COMPONENT ===');
  console.log('NotFound component rendering for path:', currentPath);
  console.log('This means the route was not matched by React Router');
  console.log('=== END NOT FOUND COMPONENT ===');

  // Don't throw 404 errors here - just render the UI
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Requested path: <code className="bg-gray-100 px-2 py-1 rounded">{currentPath}</code>
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/dashboard">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
