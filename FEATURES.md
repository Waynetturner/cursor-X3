# X3 Momentum Pro - Complete Features & Backend Integration

**Version**: 1.0  
**Date**: January 2025  
**Status**: Production Ready

---

## 🎯 Overview

This document provides comprehensive documentation for all features and backend integration for X3 Momentum Pro. The system includes tier-gated AI coaching, TTS integration, and a complete backend architecture using Supabase, Edge Functions, and N8N workflows.

---

## 🏗️ Architecture Overview

### System Architecture
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
│   (Automation)  │    │   (GPT-4)       │    │   (OpenAI.fm)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Frontend Features**
   - AI Coaching Interface
   - TTS Audio Cues
   - Rest Timer with Countdown
   - Exercise Tracking
   - Progress Analytics

2. **Backend Services**
   - Supabase Database
   - Edge Functions for TTS and AI
   - N8N Workflow Automation
   - OpenAI Integration

3. **External APIs**
   - OpenAI.fm (Premium TTS)
   - OpenAI GPT-4 (AI Coaching)
   - Supabase Auth & Database

---

## 🎛️ Feature Matrix by Subscription Tier

### Foundation Tier (Free)
- ✅ **Workout Tracking**: Basic exercise logging
- ✅ **Progress History**: View past workouts
- ✅ **Schedule**: X3 workout calendar
- ❌ **AI Coaching**: Not available (upgrade prompt)
- ❌ **TTS Audio**: Not available
- ❌ **Rest Timer**: Not available
- ❌ **Audio Cues**: Not available

### Momentum Tier (Premium)
- ✅ **Workout Tracking**: Enhanced exercise logging
- ✅ **Progress History**: Detailed analytics
- ✅ **Schedule**: X3 workout calendar with insights
- ✅ **AI Coaching**: Static rule-based coaching
- ✅ **TTS Audio**: Premium voices with context awareness
- ✅ **Rest Timer**: 90-second timer with announcements
- ✅ **Audio Cues**: Exercise completion feedback
- ✅ **Analytics**: Progress tracking and trends

### Mastery Tier (Premium+)
- ✅ **Workout Tracking**: Full feature set
- ✅ **Progress History**: Advanced analytics with insights
- ✅ **Schedule**: X3 workout calendar with AI recommendations
- ✅ **AI Coaching**: Dynamic AI-powered coaching (GPT-4)
- ✅ **TTS Audio**: Premium voices with dynamic instructions
- ✅ **Rest Timer**: Enhanced timer with coaching cues
- ✅ **Audio Cues**: Advanced feedback with motivational messaging
- ✅ **Analytics**: Comprehensive progress analysis
- ✅ **Personalization**: AI-driven recommendations

---

## 🤖 AI Coaching System

### Architecture Components

1. **AICoaching Component** (`src/components/AICoaching/AICoaching.tsx`)
   - Chat interface for user interaction
   - Real-time message display with tone indicators
   - Quick prompts for common questions
   - Tier-gated access control

2. **CoachingService** (`src/lib/coaching-service.ts`)
   - Handles coaching request processing
   - Provides fallback mechanisms
   - Analyzes workout data for insights
   - Manages coaching history

3. **Coach-Chat Edge Function** (`supabase/functions/coach-chat/index.ts`)
   - Direct OpenAI integration for Mastery tier
   - Static coaching for Momentum tier
   - Tier validation and access control
   - Response formatting and TTS integration

### Data Flow for AI Coaching
```
1. User Input → AICoaching Component
2. CoachingService → Coach-Chat Edge Function
3. Edge Function → OpenAI API (Mastery) or Static Rules (Momentum)
4. Response → TTS Generation (if enabled)
5. Audio + Text → User Interface
```

### Coaching Response Types

```typescript
interface CoachingResponse {
  message: string           // Full coaching message
  tts_message: string       // Shorter version for TTS
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory'
  confidence: number        // 0.0 to 1.0
  suggestions?: string[]    // Actionable recommendations
  success: boolean
  error?: string
}
```

### Tone System

The system uses four distinct tones to match user needs:

1. **Supportive** - For users feeling challenged or discouraged
2. **Motivational** - For users needing encouragement
3. **Educational** - For form and technique guidance
4. **Celebratory** - For achievements and milestones

### Usage Examples

#### Basic AI Coaching Usage
```typescript
import AICoaching from '@/components/AICoaching'

function WorkoutDashboard() {
  return (
    <AICoaching 
      workoutData={currentWorkoutData}
      className="mb-8"
    />
  )
}
```

#### Coaching Service Usage
```typescript
import { coachingService } from '@/lib/coaching-service'

const response = await coachingService.getCoachingResponse({
  user_id: user.id,
  user_feedback: "I'm struggling with push-ups",
  workout_data: workoutData,
  progress_history: recentWorkouts,
  coaching_type: 'dynamic'
})
```

---

## 🔊 TTS & Audio System

### Current Integration: OpenAI.fm Premium TTS

#### Key Features
- **Premium Voice Quality**: Ash voice with dynamic instructions
- **Context-Aware TTS**: Voice adapts to workout situation (energetic vs calm)
- **Separated Services**: TTS and coaching use different APIs
- **Enhanced User Experience**: More engaging and motivational audio

#### Available Voices
1. **Ash (Premium Dynamic)** - `'ash'` - *Primary voice with contextual instructions*
2. **Nova** - `'nova'` - Standard OpenAI voice
3. **Alloy** - `'alloy'` - Standard OpenAI voice
4. **Echo** - `'echo'` - Standard OpenAI voice
5. **Fable** - `'fable'` - Standard OpenAI voice

#### Dynamic Voice Instructions by Context
```typescript
const contextInstructions = {
  'exercise': 'Energetic and motivational. Encouraging and powerful.',
  'countdown': 'Building intensity. Focused and urgent with dramatic emphasis.',
  'rest': 'Calm but encouraging. Supportive and reassuring.',
  'coach': 'Professional and knowledgeable. Supportive mentor.',
  'general': 'Natural and friendly. Clear and professional.'
}
```

#### Audio Cue Events
- `exercise_complete` - Exercise finished
- `personal_best` - New personal record
- `workout_start` - Workout begins
- `workout_complete` - Workout finished
- `cadence_reminder` - Form/cadence reminder
- `rest_start` - Rest period begins
- `rest_complete` - Rest period ends

---

## 🗄️ Database Schema

### Required Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys (for Mastery tier)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key

# TTS API Keys (OpenAI.fm)
OPENAI_FM_API_KEY=your_openai_fm_api_key

# N8N Integration (for OpenAI coaching)
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

### Core Tables

#### workout_exercises Table
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

#### profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x3_start_date DATE NOT NULL,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  subscription_tier TEXT DEFAULT 'foundation' CHECK (subscription_tier IN ('foundation', 'momentum', 'mastery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_ui_settings Table
```sql
CREATE TABLE user_ui_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_voice TEXT DEFAULT 'ash',
  tts_speed DECIMAL(3,1) DEFAULT 1.0 CHECK (tts_speed >= 0.5 AND tts_speed <= 2.0),
  tts_volume DECIMAL(3,1) DEFAULT 0.8 CHECK (tts_volume >= 0.0 AND tts_volume <= 1.0),
  rest_timer_enabled BOOLEAN DEFAULT TRUE,
  cadence_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### coaching_requests Table
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
```

#### tts_requests Table
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
```

### Row Level Security (RLS) Policies

All tables include comprehensive RLS policies to ensure users can only access their own data:

```sql
-- Example for workout_exercises
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout data" ON workout_exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout data" ON workout_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout data" ON workout_exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout data" ON workout_exercises
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 🚀 Edge Functions Setup

### Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login and link project:
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Deploy functions:
```bash
supabase functions deploy generate-speech
supabase functions deploy coach-chat
```

4. Set environment variables:
```bash
supabase secrets set OPENAI_FM_API_KEY=your-openai-fm-key
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Edge Function Configuration

#### generate-speech Function (TTS)
- **Endpoint**: `openai.fm/v1/audio/speech`
- **API Key**: `OPENAI_FM_API_KEY`
- **Default Voice**: `'ash'` (premium dynamic voice)
- **Context Support**: Dynamic voice instructions

#### coach-chat Function (AI Coaching)
- **Static Coaching**: Rule-based responses (Momentum tier)
- **Dynamic Coaching**: OpenAI GPT-4 integration (Mastery tier)
- **Fallback Support**: Graceful degradation
- **Response Formatting**: Structured coaching responses

---

## 🔄 N8N Workflow Setup

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

---

## 🧪 Testing & Verification

### Using the BackendTester Component

1. Navigate to Settings → Advanced (requires Momentum or Mastery tier)
2. The BackendTester component will automatically check:
   - Environment variable configuration
   - Supabase database connection
   - Table access permissions
   - Edge Function availability
   - N8N workflow status

### Manual Testing Procedures

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
    voice: 'ash',
    context: 'exercise',
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

### Expected Data Flow

```
1. User submits workout data → Supabase workout_exercises table
2. App requests coaching → Edge Function coach-chat
3. Edge Function validates user tier → Routes to appropriate coaching
4. For Mastery tier → N8N workflow processes with OpenAI
5. Response returned → UI displays coaching message
6. TTS enabled → generate-speech function creates audio
7. Audio plays → Enhanced user experience
```

### Feature Testing Checklist

#### Foundation Tier Testing
- [ ] Workout tracking works without premium features
- [ ] AI coaching shows upgrade prompt
- [ ] TTS is disabled
- [ ] Rest timer is not available
- [ ] Basic progress tracking works

#### Momentum Tier Testing
- [ ] AI coaching provides static responses
- [ ] TTS works with premium voices
- [ ] Rest timer functions with announcements
- [ ] Audio cues play for exercise completion
- [ ] Enhanced analytics available

#### Mastery Tier Testing
- [ ] AI coaching provides dynamic GPT-4 responses
- [ ] TTS uses context-aware voice instructions
- [ ] Rest timer includes detailed coaching
- [ ] Advanced audio feedback works
- [ ] Comprehensive analytics available

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Set
- Check `.env.local` file exists
- Verify all required variables are set
- Restart development server after changes

#### 2. Supabase Connection Issues
- Verify project URL and API keys
- Check RLS policies are correctly configured
- Ensure tables exist with correct schema

#### 3. Edge Function Deployment Issues
- Check Supabase CLI is installed and logged in
- Verify project is linked correctly
- Check function logs in Supabase dashboard

#### 4. N8N Workflow Issues
- Verify webhook URL is accessible
- Check OpenAI API key is valid
- Review workflow logs in N8N dashboard

#### 5. TTS Function Errors
```bash
# Check if function is deployed
supabase functions list

# If not deployed, deploy it
supabase functions deploy generate-speech

# Check if API key is set
supabase secrets list

# Set the OpenAI.fm API key if missing
supabase secrets set OPENAI_FM_API_KEY=your-key-here
```

#### 6. AI Coaching Not Working
- Check subscription tier (Foundation has no AI coaching)
- Verify OpenAI API key is valid for Mastery tier
- Check N8N workflow is active
- Review coaching request logs

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_BACKEND=true
NEXT_PUBLIC_DEBUG_TTS=true
NEXT_PUBLIC_DEBUG_COACHING=true
```

This will log detailed information about all operations to the browser console.

---

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **RLS Policies**: Always use Row Level Security for user data
3. **Input Validation**: Validate all user inputs in Edge Functions
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Error Handling**: Don't expose sensitive information in error messages
6. **Authentication**: All requests require valid user authentication
7. **Authorization**: Tier-based access control
8. **Data Privacy**: User data is not stored in external APIs

---

## 📊 Monitoring and Analytics

### Key Metrics to Track

1. **Usage Metrics**
   - Coaching request volume by tier
   - TTS usage and success rates
   - User engagement with features
   - Feature adoption rates

2. **Performance Metrics**
   - Edge Function execution times
   - Database query performance
   - API response times
   - Error rates and types

3. **Business Metrics**
   - Subscription tier distribution
   - Feature usage correlation with retention
   - Premium feature engagement
   - Support request patterns

### Monitoring Tools

#### Supabase Analytics
- Monitor database performance in Supabase dashboard
- Track Edge Function execution times
- Review authentication logs

#### N8N Monitoring
- Monitor workflow execution times
- Track API usage and costs
- Review error logs

#### Application Monitoring
- Use browser dev tools to monitor network requests
- Check console logs for errors
- Monitor user experience metrics

---

## 🔮 Future Enhancements

### Short-term (Next 3 months)
1. **Conversation Memory** - Remember previous coaching interactions
2. **Voice Input** - Speech-to-text for user input
3. **Enhanced Analytics** - More detailed progress insights
4. **Offline Support** - Cache audio files for offline use

### Medium-term (3-6 months)
1. **Video Analysis** - Form feedback from video uploads
2. **Personalized Goals** - AI-driven goal setting
3. **Progress Predictions** - AI-powered progress forecasting
4. **Multi-language Support** - International expansion

### Long-term (6+ months)
1. **Wearable Integration** - Connect with fitness trackers
2. **Social Features** - Community and sharing
3. **Custom Voice Training** - Personalized voice models
4. **AR/VR Support** - Immersive workout experiences

---

**Implementation Status**: Complete  
**Last Updated**: January 2025  
**Version**: 1.0 (Post-Cleanup)  
**Deployment**: Production Ready  
**Primary TTS Voice**: Ash (Premium Dynamic)  
**AI Model**: GPT-4 (Mastery Tier)
