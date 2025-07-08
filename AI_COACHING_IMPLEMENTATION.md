# X3 Momentum Pro - AI Coaching Implementation

## Overview

This document describes the AI coaching system implementation for X3 Momentum Pro. The system provides tier-gated AI-powered coaching that integrates with the existing TTS system to deliver personalized workout feedback and guidance.

## Architecture

### Core Components

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

4. **Database Tables**
   - `coaching_requests` - Stores coaching interactions
   - `tts_requests` - Tracks TTS usage
   - `workout_exercises` - Workout data for context

## Tier-Gated Features

### Foundation Tier
- **AI Coaching**: Not available
- **Interface**: Shows upgrade prompt
- **Features**: None

### Momentum Tier
- **AI Coaching**: Static rule-based coaching
- **Interface**: Full chat interface
- **Features**: 
  - Basic workout analysis
  - Encouragement and motivation
  - Form reminders
  - Progress tracking

### Mastery Tier
- **AI Coaching**: Dynamic AI-powered coaching
- **Interface**: Full chat interface with enhanced features
- **Features**:
  - Personalized AI responses
  - Advanced workout analysis
  - Detailed recommendations
  - Progress insights
  - Form and technique guidance

## Data Flow

```
1. User Input → AICoaching Component
2. CoachingService → Coach-Chat Edge Function
3. Edge Function → OpenAI API (Mastery) or Static Rules (Momentum)
4. Response → TTS Generation (if enabled)
5. Audio + Text → User Interface
```

## Database Schema

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
```

## API Integration

### Coach-Chat Edge Function

The Edge Function supports two coaching types:

1. **Static Coaching** (Momentum Tier)
   - Rule-based responses
   - Pre-defined message templates
   - Workout data analysis
   - No external API calls

2. **Dynamic Coaching** (Mastery Tier)
   - OpenAI GPT-4 integration
   - Personalized responses
   - Context-aware feedback
   - Fallback to static coaching

### OpenAI Integration

For Mastery tier users, the system integrates directly with OpenAI's GPT-4 API:

```typescript
const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert X3 resistance band trainer...'
      },
      {
        role: 'user',
        content: `User feedback: "${user_feedback}"...`
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  })
})
```

## Usage Examples

### Basic AI Coaching Usage

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

### Coaching Service Usage

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

### Workout Analysis

```typescript
const analysis = coachingService.analyzeWorkoutData(workoutData)
console.log('Total reps:', analysis.totalReps)
console.log('Recommendations:', analysis.recommendations)
```

## Response Types

The AI coaching system provides responses with the following structure:

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

## Tone System

The system uses four distinct tones to match user needs:

1. **Supportive** - For users feeling challenged or discouraged
2. **Motivational** - For users needing encouragement
3. **Educational** - For form and technique guidance
4. **Celebratory** - For achievements and milestones

## Error Handling

The system includes comprehensive error handling:

1. **API Failures** - Fallback to static coaching
2. **Network Issues** - Graceful degradation
3. **Invalid Responses** - Default encouraging messages
4. **Authentication Errors** - Clear user feedback

## Performance Considerations

- **Caching** - Coaching responses are not cached to ensure freshness
- **Rate Limiting** - OpenAI API calls are limited per user
- **Response Time** - Static coaching responds immediately
- **Fallbacks** - Multiple layers of fallback mechanisms

## Security

- **Authentication** - All requests require valid user authentication
- **Authorization** - Tier-based access control
- **Data Privacy** - User data is not stored in external APIs
- **Input Validation** - All user inputs are sanitized

## Testing

### Manual Testing

1. **Foundation Tier**: Verify coaching is not available
2. **Momentum Tier**: Test static coaching responses
3. **Mastery Tier**: Test dynamic AI coaching
4. **Error Scenarios**: Test fallback mechanisms

### Automated Testing

The system includes comprehensive error handling and loading states for robust operation.

## Monitoring

### Key Metrics

- Coaching request volume by tier
- Response success rates
- User engagement with coaching
- TTS usage with coaching responses

### Logging

- All coaching requests are logged to `coaching_requests` table
- TTS requests are logged to `tts_requests` table
- Error logs are captured for debugging

## Future Enhancements

1. **Conversation Memory** - Remember previous interactions
2. **Voice Input** - Speech-to-text for user input
3. **Video Analysis** - Form feedback from video uploads
4. **Personalized Goals** - AI-driven goal setting
5. **Progress Predictions** - AI-powered progress forecasting

## Troubleshooting

### Common Issues

1. **No AI Responses**
   - Check subscription tier
   - Verify OpenAI API key (Mastery tier)
   - Check network connectivity

2. **Slow Responses**
   - Static coaching should be instant
   - Dynamic coaching may take 2-5 seconds
   - Check OpenAI API status

3. **TTS Not Working**
   - Verify TTS is enabled in settings
   - Check subscription tier for TTS access
   - Review browser audio permissions

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_COACHING=true
```

This will log detailed coaching operations to the browser console.

## Integration with Existing Systems

The AI coaching system integrates seamlessly with:

1. **TTS System** - Coaching responses are spoken aloud
2. **Workout Tracking** - Uses real workout data for context
3. **User Management** - Respects subscription tiers
4. **Analytics** - Tracks coaching usage and effectiveness

---

**Implementation Status**: Complete  
**Last Updated**: January 2025  
**Version**: 1.0 