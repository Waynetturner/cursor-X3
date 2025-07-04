
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const RouteTestComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  console.log('=== ROUTE TEST COMPONENT ===');
  console.log('Current pathname:', location.pathname);
  console.log('=== END ROUTE TEST COMPONENT ===');

  const testRoutes = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/admin', label: 'Admin' },
    { path: '/test-admin', label: 'Test Admin' },
    { path: '/auth', label: 'Auth' },
    { path: '/pricing', label: 'Pricing' }
  ];

  const handleNavigation = (path: string) => {
    console.log('=== MANUAL NAVIGATION ===');
    console.log('Attempting to navigate to:', path);
    console.log('=== END MANUAL NAVIGATION ===');
    navigate(path);
  };

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded mb-4">
      <h3 className="font-bold mb-2">Route Test Component</h3>
      <p className="text-sm mb-2">Current path: {location.pathname}</p>
      <div className="flex flex-wrap gap-2">
        {testRoutes.map((route) => (
          <Button
            key={route.path}
            variant="outline"
            size="sm"
            onClick={() => handleNavigation(route.path)}
          >
            {route.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
