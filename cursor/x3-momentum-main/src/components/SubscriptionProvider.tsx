
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSubscription = async () => {
    if (!session || !user) {
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Refreshing subscription status...');
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      console.log('Subscription data:', data);
      setSubscribed(data.subscribed || false);
      setSubscriptionTier(data.subscription_tier || null);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user, session]);

  const value: SubscriptionContextType = {
    subscribed,
    subscriptionTier,
    subscriptionEnd,
    isLoading,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
