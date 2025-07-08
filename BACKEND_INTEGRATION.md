# X3 Momentum Pro - Backend Integration Guide

## Overview

This document provides a comprehensive guide for setting up and testing the backend integration for X3 Momentum Pro. The backend architecture consists of:

- **Supabase**: PostgreSQL database with authentication and real-time capabilities
- **Edge Functions**: Serverless functions for TTS and AI coaching
- **N8N**: Workflow automation for OpenAI coaching integration
- **Environment Configuration**: Secure API keys and configuration

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │───▶│   Supabase DB   │───▶│  Edge Functions │
│   (Next.js)     │    │   (PostgreSQL)  │    │  (Deno)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   N8N Workflow  │    │   OpenAI API    │    │   TTS Service   │
│   (Automation)  │    │   (GPT-4)       │    │   (Google TTS)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys (for Mastery tier)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key

# N8N Integration (for OpenAI coaching)
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## Database Schema

### workout_exercises Table
```sql
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_local_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('Push', 'Pull')),
  week_number INTEGER NOT NULL,
  exercise_name TEXT NOT NULL,
  band_color TEXT NOT NULL CHECK (band_color IN ('White', 'Light Gray', 'Dark Gray', 'Black', 'Elite')),
  full_reps INTEGER NOT NULL DEFAULT 0,
  partial_reps INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workout_exercises_user_id ON workout_exercises(user_id);
CREATE INDEX idx_workout_exercises_date ON workout_exercises(workout_local_date_time);
CREATE INDEX idx_workout_exercises_user_exercise ON workout_exercises(user_id, exercise_name);
```

### profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x3_start_date DATE NOT NULL,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  subscription_tier TEXT DEFAULT 'foundation' CHECK (subscription_tier IN ('foundation', 'momentum', 'mastery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### user_ui_settings Table
```sql
CREATE TABLE user_ui_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_voice TEXT DEFAULT 'en-US-Neural2-F',
  tts_speed DECIMAL(3,1) DEFAULT 1.0 CHECK (tts_speed >= 0.5 AND tts_speed <= 2.0),
  tts_volume DECIMAL(3,1) DEFAULT 0.8 CHECK (tts_volume >= 0.0 AND tts_volume <= 1.0),
  rest_timer_enabled BOOLEAN DEFAULT TRUE,
  cadence_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE TRIGGER update_user_ui_settings_updated_at BEFORE UPDATE ON user_ui_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### coaching_requests Table
```sql
CREATE TABLE coaching_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coaching_type TEXT NOT NULL CHECK (coaching_type IN ('static', 'dynamic')),
  user_feedback TEXT,
  subscription_tier TEXT NOT NULL,
  response_tone TEXT CHECK (response_tone IN ('supportive', 'motivational', 'educational', 'celebratory')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0.0 AND confidence <= 1.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_coaching_requests_user_id ON coaching_requests(user_id);
CREATE INDEX idx_coaching_requests_created_at ON coaching_requests(created_at);
CREATE INDEX idx_coaching_requests_type ON coaching_requests(coaching_type);
```

### tts_requests Table
```sql
CREATE TABLE tts_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  voice TEXT,
  speed DECIMAL(3,1),
  subscription_tier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tts_requests_user_id ON tts_requests(user_id);
CREATE INDEX idx_tts_requests_created_at ON tts_requests(created_at);
```

## Row Level Security (RLS) Policies

### workout_exercises RLS
```sql
-- Enable RLS
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- Users can only access their own workout data
CREATE POLICY "Users can view own workout data" ON workout_exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout data" ON workout_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout data" ON workout_exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout data" ON workout_exercises
  FOR DELETE USING (auth.uid() = user_id);
```

### profiles RLS
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users cannot delete their profile
-- No DELETE policy needed
```

### user_ui_settings RLS
```sql
-- Enable RLS
ALTER TABLE user_ui_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own UI settings
CREATE POLICY "Users can view own UI settings" ON user_ui_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own UI settings" ON user_ui_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own UI settings" ON user_ui_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own UI settings" ON user_ui_settings
  FOR DELETE USING (auth.uid() = user_id);
```

### coaching_requests RLS
```sql
-- Enable RLS
ALTER TABLE coaching_requests ENABLE ROW LEVEL SECURITY;

-- Users can only access their own coaching requests
CREATE POLICY "Users can view own coaching requests" ON coaching_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coaching requests" ON coaching_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete coaching requests (read-only for analytics)
```

### tts_requests RLS
```sql
-- Enable RLS
ALTER TABLE tts_requests ENABLE ROW LEVEL SECURITY;

-- Users can only access their own TTS requests
CREATE POLICY "Users can view own TTS requests" ON tts_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own TTS requests" ON tts_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete TTS requests (read-only for analytics)
```
```

## Edge Functions Setup

### Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy Edge Functions:
```bash
supabase functions deploy generate-speech
supabase functions deploy coach-chat
```

### Edge Function Environment Variables

Set environment variables for Edge Functions:

```bash
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## N8N Workflow Setup

### Required N8N Nodes

1. **Webhook Trigger**: Receives coaching requests from the app
2. **OpenAI Node**: Processes user feedback and generates responses
3. **HTTP Request Node**: Sends responses back to the app
4. **Error Handling**: Manages failures gracefully

### N8N Workflow Configuration

1. Create a new workflow in N8N
2. Add a Webhook trigger node
3. Configure the webhook URL (this will be your `NEXT_PUBLIC_N8N_WEBHOOK_URL`)
4. Add OpenAI node with your API key
5. Configure the prompt for X3-specific coaching
6. Add HTTP Request node to send responses back
7. Activate the workflow

### Sample N8N Workflow JSON

```json
{
  "name": "X3 Coaching Workflow",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "x3-coaching",
        "responseMode": "responseNode"
      },
      "id": "webhook-trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "authentication": "apiKey",
        "apiKey": "={{ $env.OPENAI_API_KEY }}",
        "model": "gpt-4",
        "messages": {
          "messageValues": [
            {
              "role": "system",
              "content": "You are an expert X3 resistance band trainer and motivational coach."
            },
            {
              "role": "user",
              "content": "User feedback: {{ $json.user_feedback }}\nWorkout data: {{ JSON.stringify($json.workout_data) }}"
            }
          ]
        }
      },
      "id": "openai-node",
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [460, 300]
    }
  ]
}
```

## Testing Backend Integration

### Using the BackendTester Component

1. Navigate to Settings → Advanced (requires Momentum or Mastery tier)
2. The BackendTester component will automatically check:
   - Environment variable configuration
   - Supabase database connection
   - Table access permissions
   - Edge Function availability
   - N8N workflow status

### Manual Testing

#### Test Supabase Connection
```javascript
import { supabase } from '@/lib/supabase'

// Test authentication
const { data: { user }, error } = await supabase.auth.getUser()
console.log('User:', user, 'Error:', error)

// Test table access
const { data, error } = await supabase
  .from('workout_exercises')
  .select('*')
  .limit(1)
console.log('Table access:', data, 'Error:', error)
```

#### Test Edge Functions
```javascript
// Test generate-speech
const response = await fetch('/functions/v1/generate-speech', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    text: 'Test speech generation',
    user_id: 'test-user-id'
  })
})
console.log('Speech response:', await response.json())

// Test coach-chat
const coachingResponse = await fetch('/functions/v1/coach-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    user_id: 'test-user-id',
    user_feedback: 'Test feedback',
    coaching_type: 'static'
  })
})
console.log('Coaching response:', await coachingResponse.json())
```

#### Test N8N Integration
```javascript
import { n8nService } from '@/lib/n8n-integration'

// Test N8N connection
const status = await n8nService.getWorkflowStatus()
console.log('N8N status:', status)

// Test coaching request
const response = await n8nService.sendCoachingRequest({
  user_id: 'test-user-id',
  user_feedback: 'Test feedback',
  workout_data: [],
  progress_history: [],
  user_profile: {}
})
console.log('N8N coaching response:', response)
```

## Data Flow Testing

The BackendTester component includes a comprehensive data flow test that verifies:

1. **UI → Supabase**: User authentication and data access
2. **Supabase → Edge Functions**: Edge function availability and authentication
3. **Edge Functions → N8N**: N8N workflow connectivity
4. **N8N → UI**: Response handling and display

### Expected Data Flow

```
1. User submits workout data → Supabase workout_exercises table
2. App requests coaching → Edge Function coach-chat
3. Edge Function validates user tier → Routes to appropriate coaching
4. For Mastery tier → N8N workflow processes with OpenAI
5. Response returned → UI displays coaching message
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check `.env.local` file exists
   - Verify all required variables are set
   - Restart development server after changes

2. **Supabase Connection Issues**
   - Verify project URL and API keys
   - Check RLS policies are correctly configured
   - Ensure tables exist with correct schema

3. **Edge Function Deployment Issues**
   - Check Supabase CLI is installed and logged in
   - Verify project is linked correctly
   - Check function logs in Supabase dashboard

4. **N8N Workflow Issues**
   - Verify webhook URL is accessible
   - Check OpenAI API key is valid
   - Review workflow logs in N8N dashboard

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_BACKEND=true
```

This will log detailed information about all backend operations to the browser console.

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **RLS Policies**: Always use Row Level Security for user data
3. **Input Validation**: Validate all user inputs in Edge Functions
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Error Handling**: Don't expose sensitive information in error messages

## Performance Optimization

1. **Database Indexes**: Ensure proper indexes on frequently queried columns
2. **Edge Function Caching**: Cache responses where appropriate
3. **Connection Pooling**: Use connection pooling for database connections
4. **CDN**: Use CDN for static assets and API responses

## Monitoring and Analytics

### Supabase Analytics
- Monitor database performance in Supabase dashboard
- Track Edge Function execution times
- Review authentication logs

### N8N Monitoring
- Monitor workflow execution times
- Track API usage and costs
- Review error logs

### Application Monitoring
- Use browser dev tools to monitor network requests
- Check console logs for errors
- Monitor user experience metrics

## Support

For backend integration issues:

1. Check the BackendTester component in Settings → Advanced
2. Review this documentation
3. Check Supabase and N8N logs
4. Contact the development team with specific error messages

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready 