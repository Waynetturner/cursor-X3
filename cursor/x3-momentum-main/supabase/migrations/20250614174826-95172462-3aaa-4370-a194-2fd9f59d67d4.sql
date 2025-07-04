
-- Create user_ui_settings table to store UI preferences
CREATE TABLE public.user_ui_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_preference TEXT DEFAULT 'american-male',
  workout_history_default TEXT DEFAULT 'last-two',
  audio_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_ui_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_ui_settings
CREATE POLICY "Users can view their own UI settings" 
  ON public.user_ui_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own UI settings" 
  ON public.user_ui_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own UI settings" 
  ON public.user_ui_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own UI settings" 
  ON public.user_ui_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add check constraints for valid values
ALTER TABLE public.user_ui_settings 
ADD CONSTRAINT valid_voice_preference 
CHECK (voice_preference IN ('american-male', 'british-male', 'american-female', 'british-female'));

ALTER TABLE public.user_ui_settings 
ADD CONSTRAINT valid_workout_history_default 
CHECK (workout_history_default IN ('last-two', 'week', 'month', 'six-months', 'all'));
