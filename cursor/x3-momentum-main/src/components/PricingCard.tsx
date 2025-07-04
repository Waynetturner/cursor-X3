
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useSubscription } from './SubscriptionProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
}

interface PricingCardProps {
  tier: PricingTier;
}

export const PricingCard: React.FC<PricingCardProps> = ({ tier }) => {
  const { session } = useAuth();
  const { subscriptionTier, subscribed } = useSubscription();
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const isCurrentPlan = subscribed && subscriptionTier === tier.id;

  const handleSubscribe = async () => {
    if (!session) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setIsLoading(true);
    setCouponError('');

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          tier: tier.id,
          coupon_code: couponCode || undefined
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        if (error.message.includes('coupon') || error.message.includes('Coupon')) {
          setCouponError(error.message);
        } else {
          toast.error('Failed to create checkout session');
        }
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`relative ${tier.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
      {tier.popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
          <Sparkles className="h-3 w-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
        <div className="text-3xl font-bold">
          ${tier.price / 100}
          <span className="text-lg font-normal text-gray-600">/month</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {!isCurrentPlan && (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Coupon code (optional)"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponError('');
              }}
              className={couponError ? 'border-red-500' : ''}
            />
            {couponError && (
              <p className="text-sm text-red-500">{couponError}</p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSubscribe}
          disabled={isLoading || isCurrentPlan}
          className={`w-full ${tier.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            tier.buttonText
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
