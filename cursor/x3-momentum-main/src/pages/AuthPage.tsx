
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { EmailConfirmationNotice } from '@/components/EmailConfirmationNotice';

const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { user, isLoading } = useAuth();

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setShowEmailConfirmation(false);
  };

  const handleSignUpSuccess = () => {
    setShowEmailConfirmation(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and email is confirmed, redirect to main app
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏋️‍♂️ PapaFit X3 Tracker
          </h1>
          <p className="text-gray-600">
            Secure workout tracking with variable resistance training using the X3 band system
          </p>
        </div>
        
        {showEmailConfirmation ? (
          <EmailConfirmationNotice />
        ) : (
          <AuthForm 
            mode={mode} 
            onToggleMode={toggleMode}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
