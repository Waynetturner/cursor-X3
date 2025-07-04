
import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/components/SubscriptionProvider';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    const handleSuccess = async () => {
      if (sessionId) {
        try {
          // Handle checkout success (record coupon usage if applicable)
          await supabase.functions.invoke('handle-checkout-success', {
            body: { session_id: sessionId }
          });
          
          // Refresh subscription status
          await refreshSubscription();
        } catch (error) {
          console.error('Error handling checkout success:', error);
        }
      }
    };

    handleSuccess();
  }, [sessionId, refreshSubscription]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for subscribing to PapaFit! Your subscription is now active and you have access to all the features in your plan.
        </p>
        
        <div className="space-y-4">
          <Link to="/">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <Link to="/pricing">
            <Button variant="outline" className="w-full">
              View All Plans
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          You'll receive a confirmation email shortly with your subscription details.
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
