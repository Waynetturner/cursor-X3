
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Only set authenticated users if their email is confirmed
        if (session?.user && session.user.email_confirmed_at) {
          console.log('User email confirmed, setting session');
          setSession(session);
          setUser(session.user);
        } else if (session?.user && !session.user.email_confirmed_at) {
          console.log('User email not confirmed, clearing session');
          // Don't set the session/user if email isn't confirmed
          setSession(null);
          setUser(null);
          
          // Show info message for signup events (we can't directly compare event to 'SIGNED_UP')
          if (event === 'SIGNED_IN') {
            toast.info('Please check your email to confirm your account');
          }
        } else {
          console.log('No session, clearing user');
          setSession(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email, 'Confirmed:', session?.user?.email_confirmed_at);
      
      // Only set session if email is confirmed
      if (session?.user && session.user.email_confirmed_at) {
        setSession(session);
        setUser(session.user);
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('Signing out user');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Error signing out');
      } else {
        setUser(null);
        setSession(null);
        toast.success('Signed out successfully');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('Unexpected error during sign out');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
