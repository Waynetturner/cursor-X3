
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const TestAdmin = () => {
  console.log('=== TEST ADMIN ===');
  console.log('TestAdmin component rendering');
  console.log('TestAdmin: Route matched successfully!');
  console.log('=== END TEST ADMIN ===');
  
  const { user, isLoading } = useAuth();
  console.log('Test admin - current user:', user?.email);
  console.log('Test admin - is loading:', isLoading);

  // Show loading state while auth is being determined
  if (isLoading) {
    console.log('Test admin: Still loading auth state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test admin page...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Only allow specific admin users for this test page too
  const isAdmin = user?.email === 'wayne@waynetturner.com';
  console.log('Is admin check:', isAdmin);

  if (!isAdmin) {
    console.log('User is not admin, showing access denied');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this test page.</p>
          <Link to="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  console.log('Rendering test admin page for authorized user');
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded inline-block">
          <p className="text-green-800 font-semibold">🎉 Test Admin route is working!</p>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Admin Page</h1>
        <p className="text-gray-600">This is a simple test page to verify routing works.</p>
        <p className="text-sm text-gray-500 mt-4">Route: /test-admin</p>
        <p className="text-sm text-gray-500">Current user: {user?.email}</p>
        
        <div className="mt-6 space-x-4">
          <Link to="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link to="/admin">
            <Button>
              Go to Admin Panel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TestAdmin;
