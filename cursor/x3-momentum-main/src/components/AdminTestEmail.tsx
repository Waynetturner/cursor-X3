
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const AdminTestEmail = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!adminEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive the test notification.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Sending test admin notification to:', adminEmail);

    try {
      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          adminEmail: adminEmail,
          isTest: true
        }
      });

      if (error) {
        console.error('Error sending test email:', error);
        toast({
          title: "Error",
          description: `Failed to send test email: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Test email response:', data);
      toast({
        title: "Test Email Sent! 📧",
        description: `Check your inbox at ${adminEmail} for the test notification.`
      });
    } catch (error: any) {
      console.error('Error calling function:', error);
      toast({
        title: "Error",
        description: "Failed to send test email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🧪 Test Admin Notifications
      </h3>
      <p className="text-gray-600 mb-4 text-sm">
        Send a test notification email to verify your admin email setup is working correctly.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your admin email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={sendTestEmail} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Sending...' : 'Send Test'}
        </Button>
      </div>
    </div>
  );
};
