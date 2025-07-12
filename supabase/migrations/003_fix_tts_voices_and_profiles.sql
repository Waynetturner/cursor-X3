-- Migration: Fix TTS voice format and create profiles table
-- Date: 2025-07-12
-- Description: Update TTS voices to OpenAI format and create profiles table

-- Update TTS voice column to use OpenAI format instead of Google TTS format
ALTER TABLE user_ui_settings 
ALTER COLUMN tts_voice SET DEFAULT 'ash';

-- Update existing records that have the old Google TTS format
UPDATE user_ui_settings 
SET tts_voice = 'ash' 
WHERE tts_voice = 'en-US-Neural2-F' OR tts_voice LIKE 'en-US-%';

-- Add constraint for valid OpenAI TTS voices
ALTER TABLE user_ui_settings 
ADD CONSTRAINT valid_tts_voice 
CHECK (tts_voice IN ('ash', 'nova', 'alloy', 'echo'));

-- Update comment to reflect OpenAI format
COMMENT ON COLUMN user_ui_settings.tts_voice IS 'OpenAI TTS voice identifier (ash, nova, alloy, echo)';

-- Create profiles table for user profile data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  x3_start_date DATE,
  fitness_experience TEXT CHECK (fitness_experience IN ('beginner', 'intermediate', 'advanced')),
  primary_goal TEXT CHECK (primary_goal IN ('strength', 'muscle', 'endurance', 'general', 'weight-loss')),
  preferred_workout_days TEXT[], -- Array of day abbreviations: ['Mon', 'Tue', etc]
  subscription_tier TEXT DEFAULT 'foundation' CHECK (subscription_tier IN ('foundation', 'momentum', 'mastery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Comment on table and columns
COMMENT ON TABLE profiles IS 'User profile information including X3 journey details';
COMMENT ON COLUMN profiles.display_name IS 'User display name shown in app';
COMMENT ON COLUMN profiles.x3_start_date IS 'Date when user started X3 program';
COMMENT ON COLUMN profiles.fitness_experience IS 'User fitness experience level';
COMMENT ON COLUMN profiles.primary_goal IS 'User primary fitness goal';
COMMENT ON COLUMN profiles.preferred_workout_days IS 'Array of preferred workout days';
COMMENT ON COLUMN profiles.subscription_tier IS 'Current subscription tier';