# X3 Momentum Pro - Complete TTS & Audio Implementation

## Overview

This document provides comprehensive documentation for the Text-to-Speech (TTS) and audio system implementation for X3 Momentum Pro. The system provides tier-gated audio features that enhance the workout experience with voice coaching, rest timer announcements, and exercise completion feedback.

## 🎤 Current Integration: OpenAI.fm Premium TTS

### Key Features
- **Premium Voice Quality**: Ash voice with dynamic instructions
- **Context-Aware TTS**: Voice adapts to workout situation (energetic vs calm)
- **Separated Services**: TTS and coaching use different APIs
- **Enhanced User Experience**: More engaging and motivational audio

### OpenAI.fm vs Standard OpenAI
- ✅ **'ash' Voice**: Premium dynamic voice not available in standard OpenAI
- ✅ **Instructions Parameter**: Supports dynamic voice directions
- ✅ **Context-Aware**: Voice adapts to workout situation
- ✅ **Enhanced Quality**: Premium voice synthesis with emotional range

## Architecture

### Core Components

1. **useX3TTS Hook** (`src/hooks/useX3TTS.ts`)
   - Manages TTS state and settings
   - Integrates with the `generate-speech` Edge Function
   - Handles audio playback and queue management
   - Saves/loads user preferences
   - **Default Voice**: `'ash'` (Premium Dynamic)
   - **UI Indicator**: "🎤 OpenAI.fm TTS"

2. **RestTimer Component** (`src/components/RestTimer/RestTimer.tsx`)
   - 90-second rest timer with visual progress ring
   - Tier-gated: Momentum and Mastery only
   - TTS announcements at 60s, 30s, 10s, and 5s remaining
   - Play/pause/reset controls

3. **TTSSettings Component** (`src/components/TTSSettings/TTSSettings.tsx`)
   - Modal interface for TTS configuration
   - Voice selection, speed, and volume controls
   - Test voice functionality
   - Tier-gated access

4. **AudioCues Component** (`src/components/AudioCues/AudioCues.tsx`)
   - Provides tier-specific audio feedback
   - Handles exercise completion, personal bests, workout events
   - Includes `useAudioCues` hook for easy integration

### Edge Function (`/supabase/functions/generate-speech/index.ts`)

**Current Configuration (OpenAI.fm):**
- **API Key**: `OPENAI_FM_API_KEY`
- **Endpoint**: `openai.fm/v1/audio/speech`
- **Default Voice**: `'ash'` (premium dynamic voice)
- **Instructions Support**: Dynamic voice directions based on context
- **Error Handling**: Updated to reference OpenAI.fm API

**Available Voices:**
1. **Ash (Premium Dynamic)** - `'ash'` - *Primary voice with contextual instructions*
2. **Nova** - `'nova'` - Standard OpenAI voice
3. **Alloy** - `'alloy'` - Standard OpenAI voice
4. **Echo** - `'echo'` - Standard OpenAI voice
5. **Fable** - `'fable'` - Standard OpenAI voice

### Dynamic Voice Instructions by Context

```typescript
const contextInstructions = {
  'exercise': 'Energetic and motivational. Encouraging and powerful.',
  'countdown': 'Building intensity. Focused and urgent with dramatic emphasis.',
  'rest': 'Calm but encouraging. Supportive and reassuring.',
  'coach': 'Professional and knowledgeable. Supportive mentor.',
  'general': 'Natural and friendly. Clear and professional.'
}
```

### Database Schema

The `user_ui_settings` table has been extended with TTS-specific fields:

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

## Tier-Gated Features

### Foundation Tier
- **TTS**: Disabled (silent)
- **Rest Timer**: Not available
- **Audio Cues**: None

### Momentum Tier
- **TTS**: Scripted responses with premium voices
- **Rest Timer**: Available with basic announcements
- **Audio Cues**: Exercise completion, workout start/end
- **Voice Options**: 5 neural voices including Ash
- **Settings**: Speed and volume control

### Mastery Tier
- **TTS**: AI-enhanced + scripted responses with premium voices
- **Rest Timer**: Available with detailed coaching
- **Audio Cues**: Enhanced feedback with motivational messaging
- **Voice Options**: 5 neural voices including Ash
- **Settings**: Full control over all parameters

## 🚀 Deployment & Setup

### 1. Deploy the Edge Function

```bash
# Navigate to project root
cd /home/waynetturner/projects/x3-tracker

# Deploy the generate-speech function 
supabase functions deploy generate-speech

# Verify deployment
supabase functions list
```

### 2. Set Required Environment Variables

```bash
# Set OpenAI.fm API key (required for premium TTS)
supabase secrets set OPENAI_FM_API_KEY=your-openai-fm-api-key-here

# Set standard OpenAI key (for coach chat - separate service)
supabase secrets set OPENAI_API_KEY=sk-your-standard-openai-key-here

# Verify secrets are set
supabase secrets list
```

### 3. Test the Deployed Function

```bash
# Test direct API call
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-speech' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Let'\''s crush this chest press! Focus on controlled movement.",
    "voice": "ash",
    "speed": 1.0,
    "user_id": "test-user-id",
    "context": "exercise"
  }'
```

### 4. Monitor Function Logs

```bash
# Monitor function logs for debugging
supabase functions logs generate-speech --follow
```

## Usage Examples

### Basic TTS Usage

```typescript
import { useX3TTS } from '@/hooks/useX3TTS'

function MyComponent() {
  const { speak, isTTSAvailable, settings } = useX3TTS()
  
  const handleExerciseComplete = async () => {
    if (isTTSAvailable && settings.enabled) {
      await speak("Great work! Exercise completed.", 'exercise')
    }
  }
  
  return (
    <button onClick={handleExerciseComplete}>
      Complete Exercise
    </button>
  )
}
```

### Context-Aware TTS Examples

```typescript
// Exercise context (energetic, motivational)
await speak("Let's crush this chest press!", 'exercise')

// Countdown context (intense, building anticipation)
await speak("three", 'countdown')

// Rest context (calm, supportive)
await speak("Rest period complete. Time to get back to work!", 'rest')

// Coach context (professional, knowledgeable)
await speak("Based on your progress, try increasing your resistance.", 'coach')
```

### Audio Cues Integration

```typescript
import { useAudioCues } from '@/components/AudioCues'

function WorkoutComponent() {
  const { triggerCue, isAudioAvailable } = useAudioCues()
  
  const handlePersonalBest = async () => {
    await triggerCue({
      type: 'personal_best',
      data: {
        exerciseName: 'Push-ups',
        reps: 25,
        bandColor: 'Black'
      }
    })
  }
  
  return (
    <button onClick={handlePersonalBest}>
      Record Personal Best
    </button>
  )
}
```

### Rest Timer Integration

```typescript
import RestTimer from '@/components/RestTimer'

function WorkoutDashboard() {
  return (
    <RestTimer 
      duration={90}
      onComplete={() => {
        console.log('Rest period complete')
      }}
    />
  )
}
```

## Expected Behavior by Context

### Exercise Context (Energetic)
```
Input: "Let's crush this chest press!"
Voice: Ash with energetic, motivational tone
Instructions: "Energetic and motivational. Encouraging and powerful."
Result: Dynamic, inspiring delivery perfect for workout motivation
```

### Countdown Context (Intense)
```
Input: "three"
Voice: Ash with building intensity
Instructions: "Building intensity. Focused and urgent with dramatic emphasis."
Result: Dramatic countdown with anticipation and readiness
```

### Rest Context (Calm)
```
Input: "Rest period complete. Time to get back to work!"
Voice: Ash with calm but encouraging tone
Instructions: "Calm but encouraging. Supportive and reassuring."
Result: Relaxed recovery-focused delivery
```

### Coach Context (Professional)
```
Input: "Based on your progress, try increasing your resistance."
Voice: Ash with professional, knowledgeable tone
Instructions: "Professional and knowledgeable. Supportive mentor."
Result: Clear, thoughtful coaching guidance
```

## Audio Cue Events

The system supports the following audio cue events:

- `exercise_complete` - Exercise finished
- `personal_best` - New personal record
- `workout_start` - Workout begins
- `workout_complete` - Workout finished
- `cadence_reminder` - Form/cadence reminder
- `rest_start` - Rest period begins
- `rest_complete` - Rest period ends

## Styling & Design

The implementation uses the X3 Momentum Pro design system:

- **Primary Color**: Fire Orange (#FF6B35)
- **Material Design**: Cards with subtle shadows
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation

## Integration Architecture

### Separated Services
- **TTS Generation**: Uses `OPENAI_FM_API_KEY` and openai.fm (premium features)
- **Coach Chat**: Uses `OPENAI_API_KEY` and standard OpenAI (unchanged)
- **No Conflicts**: Both services work independently

### Backend Integration
1. **Edge Function**: Uses the `generate-speech` function with OpenAI.fm
2. **Authentication**: Respects user authentication and subscription tiers
3. **Database**: Stores user preferences in `user_ui_settings`
4. **Error Handling**: Graceful fallbacks when TTS is unavailable

## 🔧 Troubleshooting

### Common Issues

#### 1. No Audio Playing
- Check subscription tier (Foundation has no TTS)
- Verify TTS is enabled in settings
- Check browser audio permissions
- Verify function is deployed: `supabase functions list`

#### 2. 500 Errors from TTS Function
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

#### 3. Audio Quality Issues
- Adjust speed and volume settings
- Try different voice options (Nova, Alloy for fallback)
- Check internet connection
- Verify OpenAI.fm account has sufficient credits

#### 4. Settings Not Saving
- Verify user authentication
- Check database connection
- Review browser console for errors

### Expected Results After Proper Setup

**Before Deployment (Problematic):**
```
❌ POST /functions/v1/generate-speech → 404/500
❌ Error: "Speech generation error: 500" 
❌ Falls back to Web Speech API
❌ No premium OpenAI TTS voices
```

**After Deployment (Working):**
```
✅ POST /functions/v1/generate-speech → 200
✅ Returns: {"success": true, "audio_url": "data:audio/mpeg;base64,..."}
✅ High-quality Ash/Nova TTS plays
✅ 🤖 OpenAI.fm TTS indicator shows in UI
✅ Premium voices for Momentum/Mastery users
✅ Context-aware voice instructions working
```

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_TTS=true
```

This will log detailed TTS operations to the browser console.

### Function Monitoring

```bash
# Monitor function logs in real-time
supabase functions logs generate-speech --follow

# Check recent function invocations
supabase functions logs generate-speech
```

## 📊 Verification Checklist

After deployment, verify:
- [ ] Function deployed: `supabase functions list` shows `generate-speech`
- [ ] API key set: `supabase secrets list` shows `OPENAI_FM_API_KEY`
- [ ] TTS requests show "🎤 OpenAI.fm TTS" in UI
- [ ] Console logs show "OpenAI.fm TTS successful"
- [ ] Ash voice is available and set as default in TTS settings
- [ ] Different contexts produce noticeably different voice tones
- [ ] Coach chat still works with existing n8n setup (separate API key)
- [ ] No 500 errors from generate-speech endpoint
- [ ] Premium voices available for Momentum/Mastery users

## Performance Considerations

- **Audio Caching**: Audio files are cached for better performance
- **Queue Management**: Prevents audio overlap
- **Memory Management**: Proper cleanup of audio resources
- **Network Optimization**: Efficient API calls to Edge Functions
- **Fallback Support**: Graceful degradation to Web Speech API if needed

## Future Enhancements

1. **Offline Support**: Cache audio files for offline use
2. **Custom Voices**: Allow users to upload custom voice samples
3. **Audio Analytics**: Track which audio cues are most effective
4. **Multi-language**: Support for additional languages
5. **Voice Coaching**: Real-time form feedback via audio
6. **Additional Premium Voices**: Expand OpenAI.fm voice options
7. **Emotion Detection**: Adaptive voice tone based on workout performance

---

**Implementation Status**: Complete  
**Last Updated**: January 2025  
**Version**: 2.0 (OpenAI.fm Integration)  
**Primary Voice**: Ash (Premium Dynamic)  
**Deployment**: Requires `supabase functions deploy generate-speech`
