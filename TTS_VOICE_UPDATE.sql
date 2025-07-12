-- Fix TTS Voice Settings - Update from unsupported 'ash' to 'nova'
-- This migration updates user settings to use valid OpenAI TTS voices

-- Update any users who have 'ash' voice (which doesn't exist in OpenAI TTS)
UPDATE user_ui_settings 
SET tts_voice = 'nova' 
WHERE tts_voice = 'ash';

-- Ensure all voice settings use valid OpenAI TTS voices
UPDATE user_ui_settings 
SET tts_voice = 'nova' 
WHERE tts_voice NOT IN ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer');

-- Add a comment explaining the change
COMMENT ON COLUMN user_ui_settings.tts_voice IS 'OpenAI TTS voice: alloy, echo, fable, onyx, nova, shimmer';