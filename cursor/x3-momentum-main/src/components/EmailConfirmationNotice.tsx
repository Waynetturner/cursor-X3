
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mail } from 'lucide-react';

export const EmailConfirmationNotice = () => {
  return (
    <Card className="w-full max-w-md mx-auto mt-8 border-blue-200 bg-blue-50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-blue-700">Check Your Email</CardTitle>
        <CardDescription className="text-blue-600">
          Please confirm your email address to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-blue-700 mb-4">
          We've sent a confirmation link to your email address. Please click the link to verify your account and start tracking your X3 workouts.
        </p>
        <p className="text-xs text-blue-600">
          Didn't receive the email? Check your spam folder or contact support.
        </p>
      </CardContent>
    </Card>
  );
};
