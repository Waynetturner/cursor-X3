
-- First, let's see what values currently exist
SELECT DISTINCT voice_preference FROM user_ui_settings;

-- Drop the constraint completely first
ALTER TABLE user_ui_settings DROP CONSTRAINT IF EXISTS valid_voice_preference;

-- Update all existing records to use 'male' or 'female'
UPDATE user_ui_settings 
SET voice_preference = CASE 
  WHEN voice_preference IN ('american-male', 'british-male') OR voice_preference LIKE '%male%' THEN 'male'
  WHEN voice_preference IN ('american-female', 'british-female') OR voice_preference LIKE '%female%' THEN 'female'
  ELSE 'male'
END;

-- Now add the constraint back
ALTER TABLE user_ui_settings 
ADD CONSTRAINT valid_voice_preference 
CHECK (voice_preference IN ('male', 'female'));

-- Verify the update worked
SELECT DISTINCT voice_preference FROM user_ui_settings;
