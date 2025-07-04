
import React from 'react';
import { PricingCard } from '@/components/PricingCard';
import { useSubscription } from '@/components/SubscriptionProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

const pricingTiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: 799,
    description: 'Perfect for beginners',
    features: [
      'Basic workout tracking',
      'Exercise library access',
      'Progress charts',
      'Email support'
    ],
    buttonText: 'Start Basic'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    description: 'Most popular choice',
    features: [
      'Everything in Basic',
      'Advanced analytics',
      'Custom workout plans',
      'AI Coach assistance',
      'Priority support'
    ],
    popular: true,
    buttonText: 'Go Premium'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4999,
    description: 'For serious athletes',
    features: [
      'Everything in Premium',
      'Personal trainer consultation',
      'Advanced meal planning',
      'Competition tracking',
      '24/7 phone support'
    ],
    buttonText: 'Go Pro'
  }
];

const PricingPage = () => {
  const { session } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();

  const handleManageSubscription = async () => {
    if (!session) {
      toast.error('Please sign in first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Portal error:', error);
        toast.error('Failed to open customer portal');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Fitness Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your fitness journey with our comprehensive X3 workout tracking system.
            Get the tools you need to achieve your goals.
          </p>
          
          {subscribed && (
            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg inline-block">
              <p className="text-green-800 font-semibold">
                🎉 You're currently on the {subscriptionTier?.charAt(0).toUpperCase()}{subscriptionTier?.slice(1)} plan
              </p>
              <Button 
                onClick={handleManageSubscription}
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>

        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
          <p className="text-sm mt-2">
            Have questions? Contact us at support@papafit.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
