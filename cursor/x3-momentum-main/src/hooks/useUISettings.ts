
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type WorkoutHistoryRange = 'last-two' | 'week' | 'month' | 'six-months' | 'all';

export interface UISettings {
  voice_preference?: string;
  workout_history_default?: WorkoutHistoryRange;
  audio_notifications_enabled?: boolean;
}

export const useUISettings = (isOpen: boolean) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<UISettings>({
    voice_preference: 'male', // Default to male voice
    workout_history_default: 'last-two',
    audio_notifications_enabled: true
  });

  useEffect(() => {
    if (user && isOpen) {
      loadUISettings();
    }
  }, [user, isOpen]);

  const loadUISettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_ui_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading UI settings:', error);
        return;
      }

      if (data) {
        setSettings({
          voice_preference: data.voice_preference || 'male',
          workout_history_default: (data.workout_history_default as WorkoutHistoryRange) || 'last-two',
          audio_notifications_enabled: data.audio_notifications_enabled ?? true
        });
      }
    } catch (error) {
      console.error('Error loading UI settings:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return false;

    setIsLoading(true);
    try {
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_ui_settings')
        .upsert({
          user_id: user.id,
          voice_preference: settings.voice_preference,
          workout_history_default: settings.workout_history_default,
          audio_notifications_enabled: settings.audio_notifications_enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving UI settings:', error);
        toast({
          title: "Error",
          description: "Failed to save UI settings. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Settings saved",
        description: "Your UI preferences have been updated."
      });
      return true;
    } catch (error) {
      console.error('Error saving UI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save UI settings. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = <K extends keyof UISettings>(key: K, value: UISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    isLoading,
    handleSave,
    updateSetting
  };
};
