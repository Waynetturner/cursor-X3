
import React from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminButton = () => {
  const { user } = useAuth();

  // Only show admin button for specific users
  const isAdmin = user?.email === 'wayne@waynetturner.com';

  if (!isAdmin) {
    return null;
  }

  return (
    <Link to="/admin">
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Admin
      </Button>
    </Link>
  );
};
