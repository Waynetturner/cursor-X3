
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import { AdminPanel } from '@/components/AdminPanel';
import { Button } from '@/components/ui/button';
import { LogOut, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  console.log('=== ADMIN PAGE ===');
  console.log('AdminPage component is rendering');
  console.log('AdminPage: Route matched successfully!');
  console.log('=== END ADMIN PAGE INIT ===');
  
  const { user, signOut, isLoading } = useAuth();
  console.log('Admin page - current user:', user?.email);
  console.log('Admin page - is loading:', isLoading);

  // Show loading state while auth is being determined
  if (isLoading) {
    console.log('Admin page: Still loading auth state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Only allow specific admin users
  const isAdmin = user?.email === 'wayne@waynetturner.com';
  console.log('Is admin check:', isAdmin);

  if (!isAdmin) {
    console.log('User is not admin, showing access denied');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
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

  console.log('Rendering full admin panel');
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🏋️‍♂️ PapaFit Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
          <p className="text-green-800 font-semibold">🎉 Admin route is working!</p>
          <p className="text-green-700">You have successfully accessed the admin panel.</p>
          <p className="text-green-600 text-sm">Current user: {user?.email}</p>
        </div>
        <AdminPanel />
      </main>
    </div>
  );
};

export default AdminPage;
