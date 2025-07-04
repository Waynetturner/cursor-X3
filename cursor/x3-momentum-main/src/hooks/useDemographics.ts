
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserDemographics } from '@/types/demographics';

export const useDemographics = (isOpen: boolean) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [demographics, setDemographics] = useState<UserDemographics>({});

  useEffect(() => {
    if (user && isOpen) {
      loadUserDemographics();
    }
  }, [user, isOpen]);

  const loadUserDemographics = async () => {
    if (!user) return;

    try {
      // Use RPC function to get demographics
      const { data, error } = await supabase
        .rpc('get_user_demographics', { p_user_id: user.id });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading demographics:', error);
        return;
      }

      if (data && data.length > 0) {
        setDemographics(data[0]);
      }
    } catch (error) {
      console.error('Error loading demographics:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Use RPC function for upsert
      const { error } = await supabase.rpc('upsert_user_demographics', {
        p_user_id: user.id,
        p_age: demographics.age,
        p_gender: demographics.gender,
        p_location: demographics.location,
        p_fitness_level: demographics.fitness_level,
        p_x3_program: demographics.x3_program,
        p_goals: demographics.goals,
        p_injury_history: demographics.injury_history
      });

      if (error) {
        console.error('Error saving demographics:', error);
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Settings saved",
        description: "Your demographic information has been updated."
      });
      return true;
    } catch (error) {
      console.error('Error saving demographics:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof UserDemographics, value: string | number) => {
    setDemographics(prev => ({ ...prev, [field]: value }));
  };

  return {
    demographics,
    isLoading,
    handleSave,
    updateField
  };
};
