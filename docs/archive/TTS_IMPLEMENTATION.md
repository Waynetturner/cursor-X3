# X3 Momentum Pro - TTS & Audio Implementation

## Overview

This document describes the Text-to-Speech (TTS) and audio system implementation for X3 Momentum Pro. The system provides tier-gated audio features that enhance the workout experience with voice coaching, rest timer announcements, and exercise completion feedback.

## Architecture

### Core Components

1. **useX3TTS Hook** (`src/hooks/useX3TTS.ts`)
   - Manages TTS state and settings
   - Integrates with the existing `generate-speech` Edge Function
   - Handles audio playback and queue management
   - Saves/loads user preferences

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

### Database Schema

The `user_ui_settings` table has been extended with TTS-specific fields:

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
```

## Tier-Gated Features

### Foundation Tier
- **TTS**: Disabled (silent)
- **Rest Timer**: Not available
- **Audio Cues**: None

### Momentum Tier
- **TTS**: Scripted responses
- **Rest Timer**: Available with basic announcements
- **Audio Cues**: Exercise completion, workout start/end
- **Voice Options**: 4 neural voices
- **Settings**: Speed and volume control

### Mastery Tier
- **TTS**: AI-enhanced + scripted responses
- **Rest Timer**: Available with detailed coaching
- **Audio Cues**: Enhanced feedback with motivational messaging
- **Voice Options**: 4 neural voices
- **Settings**: Full control over all parameters

## Usage Examples

### Basic TTS Usage

```typescript
import { useX3TTS } from '@/hooks/useX3TTS'

function MyComponent() {
  const { speak, isTTSAvailable, settings } = useX3TTS()
  
  const handleExerciseComplete = async () => {
    if (isTTSAvailable && settings.enabled) {
      await speak("Great work! Exercise completed.")
    }
  }
  
  return (
    <button onClick={handleExerciseComplete}>
      Complete Exercise
    </button>
  )
}
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

## Voice Options

The system includes 4 neural voice options:

1. **Sarah (Female)** - `en-US-Neural2-F`
2. **Michael (Male)** - `en-US-Neural2-M`
3. **Emma (Female)** - `en-US-Neural2-C`
4. **David (Male)** - `en-US-Neural2-D`

## Audio Cue Events

The system supports the following audio cue events:

- `exercise_complete` - Exercise finished
- `personal_best` - New personal record
- `workout_start` - Workout begins
- `workout_complete` - Workout finished
- `cadence_reminder` - Form/cadence reminder
- `rest_start` - Rest period begins
- `rest_complete` - Rest period ends

## Styling

The implementation uses the X3 Momentum Pro design system:

- **Primary Color**: Fire Orange (#FF6B35)
- **Material Design**: Cards with subtle shadows
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation

## Integration with Existing Backend

The TTS system integrates seamlessly with the existing backend:

1. **Edge Function**: Uses the existing `generate-speech` function
2. **Authentication**: Respects user authentication and subscription tiers
3. **Database**: Stores user preferences in `user_ui_settings`
4. **Error Handling**: Graceful fallbacks when TTS is unavailable

## Testing

### Manual Testing

1. **Foundation Tier**: Verify no audio plays
2. **Momentum Tier**: Test basic audio cues and rest timer
3. **Mastery Tier**: Test enhanced audio feedback
4. **Settings**: Test voice selection, speed, and volume controls

### Automated Testing

The system includes comprehensive error handling and loading states for robust operation.

## Performance Considerations

- **Audio Caching**: Audio files are cached for better performance
- **Queue Management**: Prevents audio overlap
- **Memory Management**: Proper cleanup of audio resources
- **Network Optimization**: Efficient API calls to Edge Functions

## Future Enhancements

1. **Offline Support**: Cache audio files for offline use
2. **Custom Voices**: Allow users to upload custom voice samples
3. **Audio Analytics**: Track which audio cues are most effective
4. **Multi-language**: Support for additional languages
5. **Voice Coaching**: Real-time form feedback via audio

## Troubleshooting

### Common Issues

1. **No Audio Playing**
   - Check subscription tier
   - Verify TTS is enabled in settings
   - Check browser audio permissions

2. **Audio Quality Issues**
   - Adjust speed and volume settings
   - Try different voice options
   - Check internet connection

3. **Settings Not Saving**
   - Verify user authentication
   - Check database connection
   - Review browser console for errors

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_TTS=true
```

This will log detailed TTS operations to the browser console.

---

**Implementation Status**: Complete  
**Last Updated**: January 2025  
**Version**: 1.0 