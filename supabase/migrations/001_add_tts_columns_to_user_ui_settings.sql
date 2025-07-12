-- Migration: Add TTS columns to user_ui_settings table
-- Date: 2025-07-12
-- Description: Add missing TTS-related columns for voice settings

-- Check if the table exists, if not create it
CREATE TABLE IF NOT EXISTS user_ui_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  tts_enabled BOOLEAN DEFAULT true,
  rest_timer_enabled BOOLEAN DEFAULT true,
  cadence_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Add the missing TTS columns if they don't exist
DO $$ 
BEGIN
  -- Add tts_voice column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_ui_settings' 
    AND column_name = 'tts_voice'
  ) THEN
    ALTER TABLE user_ui_settings 
    ADD COLUMN tts_voice TEXT DEFAULT 'en-US-Neural2-F';
  END IF;

  -- Add tts_speed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_ui_settings' 
    AND column_name = 'tts_speed'
  ) THEN
    ALTER TABLE user_ui_settings 
    ADD COLUMN tts_speed DECIMAL(3,1) DEFAULT 1.0 CHECK (tts_speed >= 0.5 AND tts_speed <= 2.0);
  END IF;

  -- Add tts_volume column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_ui_settings' 
    AND column_name = 'tts_volume'
  ) THEN
    ALTER TABLE user_ui_settings 
    ADD COLUMN tts_volume DECIMAL(3,1) DEFAULT 0.8 CHECK (tts_volume >= 0.0 AND tts_volume <= 1.0);
  END IF;
END $$;

-- Create or replace function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_user_ui_settings_updated_at ON user_ui_settings;
CREATE TRIGGER update_user_ui_settings_updated_at
  BEFORE UPDATE ON user_ui_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_ui_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DROP POLICY IF EXISTS "Users can view their own UI settings" ON user_ui_settings;
CREATE POLICY "Users can view their own UI settings" ON user_ui_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own UI settings" ON user_ui_settings;
CREATE POLICY "Users can insert their own UI settings" ON user_ui_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own UI settings" ON user_ui_settings;
CREATE POLICY "Users can update their own UI settings" ON user_ui_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own UI settings" ON user_ui_settings;
CREATE POLICY "Users can delete their own UI settings" ON user_ui_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_ui_settings_user_id ON user_ui_settings(user_id);

-- Comment on table and columns
COMMENT ON TABLE user_ui_settings IS 'User interface settings including TTS preferences';
COMMENT ON COLUMN user_ui_settings.tts_voice IS 'OpenAI TTS voice identifier (e.g., en-US-Neural2-F)';
COMMENT ON COLUMN user_ui_settings.tts_speed IS 'TTS playback speed (0.5 to 2.0)';
COMMENT ON COLUMN user_ui_settings.tts_volume IS 'TTS playback volume (0.0 to 1.0)';