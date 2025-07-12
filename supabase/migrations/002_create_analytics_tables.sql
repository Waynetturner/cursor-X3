-- Migration: Create analytics tables for TTS and coaching requests
-- Date: 2025-07-12
-- Description: Create tables to track TTS usage and coaching interactions

-- Create tts_requests table for tracking TTS usage
CREATE TABLE IF NOT EXISTS tts_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL, -- Truncated text for analytics (first 100 chars)
  voice TEXT NOT NULL DEFAULT 'en-US-Neural2-F',
  speed DECIMAL(3,1) DEFAULT 1.0 CHECK (speed >= 0.5 AND speed <= 2.0),
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('foundation', 'momentum', 'mastery')),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create coaching_requests table for tracking coaching interactions
CREATE TABLE IF NOT EXISTS coaching_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coaching_type TEXT NOT NULL CHECK (coaching_type IN ('static', 'dynamic')),
  user_feedback TEXT, -- Truncated feedback for analytics (first 200 chars)
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('foundation', 'momentum', 'mastery')),
  response_tone TEXT CHECK (response_tone IN ('supportive', 'motivational', 'educational', 'celebratory')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0.0 AND confidence <= 1.0),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE tts_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for tts_requests
DROP POLICY IF EXISTS "Users can view their own TTS requests" ON tts_requests;
CREATE POLICY "Users can view their own TTS requests" ON tts_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert TTS requests" ON tts_requests;
CREATE POLICY "Service role can insert TTS requests" ON tts_requests
  FOR INSERT WITH CHECK (true); -- Edge functions use service role

-- RLS policies for coaching_requests  
DROP POLICY IF EXISTS "Users can view their own coaching requests" ON coaching_requests;
CREATE POLICY "Users can view their own coaching requests" ON coaching_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert coaching requests" ON coaching_requests;
CREATE POLICY "Service role can insert coaching requests" ON coaching_requests
  FOR INSERT WITH CHECK (true); -- Edge functions use service role

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tts_requests_user_id ON tts_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_requests_created_at ON tts_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_tts_requests_subscription_tier ON tts_requests(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_coaching_requests_user_id ON coaching_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_created_at ON coaching_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_coaching_type ON coaching_requests(coaching_type);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_subscription_tier ON coaching_requests(subscription_tier);

-- Comments for documentation
COMMENT ON TABLE tts_requests IS 'Analytics table for tracking TTS API usage and performance';
COMMENT ON TABLE coaching_requests IS 'Analytics table for tracking AI coaching interactions';

COMMENT ON COLUMN tts_requests.text IS 'Truncated text content (first 100 characters) for analytics';
COMMENT ON COLUMN tts_requests.voice IS 'OpenAI TTS voice used for generation';
COMMENT ON COLUMN tts_requests.speed IS 'TTS playback speed setting';

COMMENT ON COLUMN coaching_requests.user_feedback IS 'Truncated user feedback (first 200 characters) for analytics';
COMMENT ON COLUMN coaching_requests.coaching_type IS 'Type of coaching: static (rule-based) or dynamic (AI-powered)';
COMMENT ON COLUMN coaching_requests.response_tone IS 'Tone of the coaching response provided';
COMMENT ON COLUMN coaching_requests.confidence IS 'Confidence score of the coaching response (0.0 to 1.0)';