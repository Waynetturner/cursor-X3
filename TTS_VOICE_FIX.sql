-- ==========================================
-- CRITICAL FIX: TTS Voice Format Migration
-- ==========================================
-- Run this SQL in your Supabase dashboard to fix the TTS voice format mismatch
-- Dashboard: https://kqgudwgxxggslmurmfgt.supabase.co/project/kqgudwgxxggslmurmfgt/sql/new

-- ==========================================
-- STEP 1: Check current TTS voice values
-- ==========================================
-- Run this first to see what needs to be updated:
SELECT user_id, tts_voice, tts_enabled 
FROM user_ui_settings 
WHERE tts_voice IS NOT NULL;

-- ==========================================
-- STEP 2: Update TTS voice column default
-- ==========================================
-- Change default from Google TTS format to OpenAI format
ALTER TABLE user_ui_settings 
ALTER COLUMN tts_voice SET DEFAULT 'ash';

-- ==========================================
-- STEP 3: Convert existing users to OpenAI format
-- ==========================================
-- This converts all Google TTS voices to OpenAI 'ash' voice
UPDATE user_ui_settings 
SET tts_voice = 'ash' 
WHERE tts_voice = 'en-US-Neural2-F' 
   OR tts_voice LIKE 'en-US-%'
   OR tts_voice LIKE 'en-%'
   OR tts_voice IS NULL;

-- ==========================================
-- STEP 4: Add constraint for valid voices
-- ==========================================
-- Ensure only valid OpenAI voices can be stored
DO $$ 
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_tts_voice'
  ) THEN
    ALTER TABLE user_ui_settings DROP CONSTRAINT valid_tts_voice;
  END IF;
  
  -- Add new constraint
  ALTER TABLE user_ui_settings 
  ADD CONSTRAINT valid_tts_voice 
  CHECK (tts_voice IN ('ash', 'nova', 'alloy', 'echo'));
END $$;

-- ==========================================
-- STEP 5: Update column comment
-- ==========================================
COMMENT ON COLUMN user_ui_settings.tts_voice 
IS 'OpenAI TTS voice identifier: ash (dynamic female), nova (female), alloy (neutral), echo (male)';

-- ==========================================
-- STEP 6: Verify the changes
-- ==========================================
-- Run this to confirm all voices are now in OpenAI format:
SELECT 
  tts_voice,
  COUNT(*) as user_count,
  CASE 
    WHEN tts_voice IN ('ash', 'nova', 'alloy', 'echo') THEN '✅ Valid OpenAI Voice'
    ELSE '❌ Invalid Voice Format'
  END as status
FROM user_ui_settings 
WHERE tts_voice IS NOT NULL
GROUP BY tts_voice
ORDER BY user_count DESC;

-- ==========================================
-- EXPECTED RESULT AFTER MIGRATION:
-- ==========================================
-- All users should have tts_voice = 'ash'
-- Default value should be 'ash'
-- Only valid OpenAI voices allowed: ash, nova, alloy, echo