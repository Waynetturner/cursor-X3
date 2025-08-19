# X3 Momentum Pro - API Documentation

**Version**: 2.1.0  
**Date**: January 2025  
**Target Audience**: Developers working with X3 Momentum Pro APIs and integrations

---

## Overview

This document provides comprehensive documentation for all APIs, functions, hooks, and services in the X3 Momentum Pro application. It covers both internal APIs (React hooks, services) and external integrations (Supabase, OpenAI, N8N).

---

## Table of Contents

- [React Hooks](#react-hooks)
- [Service Layer](#service-layer)
- [Component APIs](#component-apis)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [External Integrations](#external-integrations)
- [Type Definitions](#type-definitions)

---

## React Hooks

### useX3TTS

Text-to-Speech system with fallback hierarchy and loading states.

```typescript
import { useX3TTS } from '@/hooks/useX3TTS'

interface UseX3TTSReturn {
  speak: (text: string, context?: TTSContext) => Promise<void>
  isTTSAvailable: boolean
  isLoading: boolean
  error: string | null
  settings: TTSSettings
  updateSettings: (settings: Partial<TTSSettings>) => void
  getSourceIndicator: () => string
  testTTS: () => Promise<void>
}

type TTSContext = 'exercise' | 'countdown' | 'rest' | 'coach' | 'general'

interface TTSSettings {
  enabled: boolean
  voice: string
  speed: number
  volume: number
  source: 'openai' | 'webspeech' | 'browser' | 'test'
}
```

#### Usage Examples

```typescript
function ExerciseComponent() {
  const { speak, isTTSAvailable, isLoading, getSourceIndicator } = useX3TTS()
  
  const handleExerciseComplete = async () => {
    if (isTTSAvailable) {
      await speak("Exercise completed! Great job!", 'exercise')
    }
  }
  
  return (
    <div>
      <button onClick={handleExerciseComplete} disabled={isLoading}>
        Complete Exercise {isLoading && '(Speaking...)'}
      </button>
      <span className="text-sm text-gray-500">
        {getSourceIndicator()} {/* Shows: 🤖 OpenAI.fm TTS */}
      </span>
    </div>
  )
}
```

#### TTS Fallback Hierarchy
1. **OpenAI.fm TTS** (Premium - Mastery tier)
2. **Web Speech API** (Standard - Momentum/Mastery tier)
3. **Browser TTS** (Fallback)
4. **Test Mode** (Development)

---

### useRestTimer

90-second rest timer with TTS announcements and auto-progression.

```typescript
import { useRestTimer } from '@/hooks/useRestTimer'

interface UseRestTimerReturn {
  timeLeft: number
  isActive: boolean
  isPaused: boolean
  start: (nextExerciseName: string) => void
  pause: () => void
  resume: () => void
  reset: () => void
  skip: () => void
}
```

#### Usage Examples

```typescript
function WorkoutComponent() {
  const restTimer = useRestTimer()
  const { speak } = useX3TTS()
  
  const handleExerciseComplete = () => {
    // Start 90-second rest timer for next exercise
    restTimer.start("Bent Row")
  }
  
  // Timer automatically handles TTS countdown at 6, 4, 2 seconds remaining
  
  return (
    <div>
      {restTimer.isActive && (
        <div className="text-center">
          <p>Rest: {restTimer.timeLeft}s</p>
          <button onClick={restTimer.skip}>Skip Rest</button>
        </div>
      )}
    </div>
  )
}
```

---

### useSubscription

Subscription tier management and feature gating.

```typescript
import { useSubscription } from '@/hooks/useSubscription'

interface UseSubscriptionReturn {
  tier: 'foundation' | 'momentum' | 'mastery'
  hasFeature: (feature: FeatureName) => boolean
  isLoading: boolean
  upgradeRequired: (feature: FeatureName) => boolean
}

type FeatureName = 
  | 'ttsAudioCues'
  | 'restTimer'
  | 'aiCoaching'
  | 'premiumVoices'
  | 'dynamicCoaching'
  | 'advancedAnalytics'
```

#### Usage Examples

```typescript
function PremiumFeatureComponent() {
  const { hasFeature, tier, upgradeRequired } = useSubscription()
  
  if (!hasFeature('ttsAudioCues')) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p>TTS Audio requires Momentum or Mastery subscription.</p>
        <button className="mt-2 bg-fire-orange text-white px-4 py-2 rounded">
          Upgrade to {tier === 'foundation' ? 'Momentum' : 'Mastery'}
        </button>
      </div>
    )
  }
  
  return <TTSEnabledComponent />
}
```

---

### useAudioCues

Audio cue management for workout events.

```typescript
import { useAudioCues } from '@/hooks/useAudioCues'

interface UseAudioCuesReturn {
  triggerCue: (event: AudioCueEvent) => Promise<void>
  isAudioAvailable: boolean
}

interface AudioCueEvent {
  type: 'exercise_complete' | 'personal_best' | 'workout_start' | 'workout_complete' | 'cadence_reminder' | 'rest_start' | 'rest_complete'
  data?: {
    exerciseName?: string
    reps?: number
    bandColor?: string
    nextExercise?: string
  }
}
```

#### Usage Examples

```typescript
function ExerciseCard() {
  const { triggerCue, isAudioAvailable } = useAudioCues()
  
  const handlePersonalBest = async () => {
    await triggerCue({
      type: 'personal_best',
      data: {
        exerciseName: 'Deadlift',
        reps: 32,
        bandColor: 'Dark Gray'
      }
    })
  }
  
  return (
    <button onClick={handlePersonalBest}>
      Save Personal Best {isAudioAvailable && '🔊'}
    </button>
  )
}
```

---

## Service Layer

### CoachingService

AI coaching service with tier-based routing and fallback mechanisms.

```typescript
import { coachingService } from '@/lib/coaching-service'

interface CoachingRequest {
  user_id: string
  user_feedback: string
  workout_data: WorkoutExercise[]
  progress_history: WorkoutExercise[]
  coaching_type: 'static' | 'dynamic'
}

interface CoachingResponse {
  message: string
  tts_message: string
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory'
  confidence: number
  suggestions?: string[]
  success: boolean
  error?: string
}
```

#### Methods

```typescript
// Get coaching response based on user tier
const response = await coachingService.getCoachingResponse({
  user_id: user.id,
  user_feedback: "I'm struggling with deadlifts today",
  workout_data: currentWorkoutExercises,
  progress_history: recentWorkouts,
  coaching_type: tier === 'mastery' ? 'dynamic' : 'static'
})

// Analyze workout data for insights
const analysis = coachingService.analyzeWorkoutData(workoutData)
// Returns: { totalReps: number, personalBests: number, recommendations: string[] }

// Get contextual coaching for current exercise
const contextualAdvice = await coachingService.getExerciseAdvice({
  exerciseName: 'Deadlift',
  currentReps: 28,
  bandColor: 'Dark Gray',
  userFeedback: 'Feeling strong today'
})
```

---

### TestModeService

SSR-safe mock data system for development and testing.

```typescript
import { testModeService } from '@/lib/test-mode'

// Check if test mode is enabled
if (testModeService.isEnabled()) {
  // Use mock data instead of real database calls
}

// Enable/disable test mode
testModeService.enable()
testModeService.disable()

// Feature-specific mocking
if (testModeService.shouldMockTTS()) {
  console.log('🧪 Test Mode: Mock TTS played')
  return
}

if (testModeService.shouldMockWorkouts()) {
  return mockWorkoutData
}

if (testModeService.shouldMockCoaching()) {
  return mockCoachingResponse
}
```

---

### TimezoneService

Central timezone handling for the application.

```typescript
import { 
  getCurrentCentralISOString,
  formatCentralTime,
  getCentralTimeZone,
  parseCentralDate
} from '@/lib/timezone'

// Get current time in Central timezone as ISO string
const timestamp = getCurrentCentralISOString()
// Returns: "2025-01-19T14:30:00.000-06:00"

// Format time for display
const displayTime = formatCentralTime(new Date())
// Returns: "2:30 PM CST"

// Parse date string in Central timezone
const centralDate = parseCentralDate("2025-01-19")
// Returns: Date object in Central timezone

// Get timezone info
const timeZone = getCentralTimeZone()
// Returns: "America/Chicago"
```

---

### ExerciseHistoryService

Exercise data analysis and progression tracking.

```typescript
import { getWorkoutHistoryData } from '@/lib/exercise-history'

// Get exercise history with band progression analysis
const historyData = await getWorkoutHistoryData(['Deadlift', 'Bent Row', 'Bicep Curl'])

// Returns: Record<string, ExerciseHistory>
interface ExerciseHistory {
  displayText: string    // "DEADLIFT (28)" - includes highest rep count
  highestBand: string    // "Dark Gray" - highest band used
  highestReps: number    // 28 - highest reps with that band
  recentWorkouts: WorkoutExercise[]
  progressionReady: boolean  // true if 40+ reps achieved
}
```

---

## Component APIs

### ExerciseCard

Modular exercise tracking component extracted from main page.

```typescript
import ExerciseCard from '@/components/ExerciseCard'

interface ExerciseCardProps {
  exercise: Exercise
  index: number
  isActive: boolean
  onSave: (index: number, data: ExerciseData) => Promise<void>
  onStart: (index: number) => void
  loading?: boolean
  error?: string
}

interface Exercise {
  name: string           // "DEADLIFT (28)"
  exercise_name: string  // "Deadlift"
  band: string          // Pre-selected highest band
  fullReps: number
  partialReps: number
  notes: string
}

interface ExerciseData {
  band_color: string
  full_reps: number
  partial_reps: number
  notes: string
}
```

#### Usage

```typescript
<ExerciseCard
  exercise={exercise}
  index={0}
  isActive={exerciseStates[0] === 'in_progress'}
  onSave={handleSaveExercise}
  onStart={handleStartExercise}
  loading={saveLoadingStates[0]}
  error={saveErrorStates[0]}
/>
```

---

### CadenceButton

Audio metronome control component.

```typescript
import CadenceButton from '@/components/CadenceButton'

interface CadenceButtonProps {
  isActive: boolean
  onToggle: (active: boolean) => void
  interval?: number  // Default: 2000ms (2 seconds)
  disabled?: boolean
}
```

#### Usage

```typescript
const [cadenceActive, setCadenceActive] = useState(false)

<CadenceButton
  isActive={cadenceActive}
  onToggle={setCadenceActive}
  interval={2000}
  disabled={!hasFeature('cadence')}
/>
```

---

### RestTimer

90-second rest timer with visual progress and TTS.

```typescript
import RestTimer from '@/components/RestTimer'

interface RestTimerProps {
  duration?: number      // Default: 90 seconds
  nextExercise?: string  // Name of next exercise
  onComplete?: () => void
  autoStart?: boolean    // Default: true
}
```

#### Usage

```typescript
<RestTimer
  duration={90}
  nextExercise="Bent Row"
  onComplete={() => setCurrentExercise(currentExercise + 1)}
  autoStart={true}
/>
```

---

### CoachChat

AI coaching chat interface with TTS integration.

```typescript
import CoachChat from '@/components/CoachChat'

interface CoachChatProps {
  currentExercise?: {
    name: string
    band: string
    fullReps: number
    partialReps: number
    notes: string
  }
  workoutContext?: {
    workoutType: 'Push' | 'Pull' | 'Rest'
    week: number
    exercisesCompleted: number
    totalExercises: number
  }
  className?: string
}
```

#### Usage

```typescript
<CoachChat
  currentExercise={{
    name: "Deadlift",
    band: "Dark Gray",
    fullReps: 28,
    partialReps: 0,
    notes: "Felt strong today"
  }}
  workoutContext={{
    workoutType: "Pull",
    week: 6,
    exercisesCompleted: 1,
    totalExercises: 4
  }}
/>
```

---

## Database Schema

### Tables

#### workout_exercises
Primary table for exercise logging.

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
```

#### profiles
User profile and program tracking.

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

#### user_ui_settings
User interface and TTS preferences.

```sql
CREATE TABLE user_ui_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_voice TEXT DEFAULT 'ash',
  tts_speed DECIMAL(3,1) DEFAULT 1.0,
  tts_volume DECIMAL(3,1) DEFAULT 0.8,
  rest_timer_enabled BOOLEAN DEFAULT TRUE,
  cadence_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### coaching_requests
AI coaching interaction logging.

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

#### tts_requests
TTS usage tracking.

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

### Database Access Patterns

```typescript
import { supabase } from '@/lib/supabase'

// Get user's workout history
const { data: workouts, error } = await supabase
  .from('workout_exercises')
  .select('*')
  .eq('user_id', userId)
  .order('workout_local_date_time', { ascending: false })
  .limit(50)

// Save new exercise
const { error } = await supabase
  .from('workout_exercises')
  .insert({
    user_id: userId,
    workout_local_date_time: getCurrentCentralISOString(),
    workout_type: 'Push',
    week_number: 6,
    exercise_name: 'Chest Press',
    band_color: 'Dark Gray',
    full_reps: 25,
    partial_reps: 3,
    notes: 'Felt strong today'
  })

// Update user settings
const { error } = await supabase
  .from('user_ui_settings')
  .upsert({
    user_id: userId,
    tts_enabled: true,
    tts_voice: 'ash',
    tts_speed: 1.0
  })
```

---

## Edge Functions

### generate-speech

OpenAI.fm TTS integration with context-aware voice instructions.

**Endpoint**: `https://your-project.supabase.co/functions/v1/generate-speech`

#### Request

```typescript
interface GenerateSpeechRequest {
  text: string
  voice?: string        // Default: 'ash'
  speed?: number       // Default: 1.0 (0.5-2.0)
  user_id: string
  context?: 'exercise' | 'countdown' | 'rest' | 'coach' | 'general'
}

// POST request
const response = await fetch('/functions/v1/generate-speech', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    text: "Great work on that chest press!",
    voice: 'ash',
    speed: 1.0,
    user_id: user.id,
    context: 'exercise'
  })
})
```

#### Response

```typescript
interface GenerateSpeechResponse {
  success: boolean
  audio_url?: string    // Base64 encoded audio data URL
  error?: string
  source: 'openai_fm' | 'openai_standard' | 'fallback'
}
```

#### Context-Aware Instructions

```typescript
const contextInstructions = {
  'exercise': 'Energetic and motivational. Encouraging and powerful.',
  'countdown': 'Building intensity. Focused and urgent with dramatic emphasis.',
  'rest': 'Calm but encouraging. Supportive and reassuring.',
  'coach': 'Professional and knowledgeable. Supportive mentor.',
  'general': 'Natural and friendly. Clear and professional.'
}
```

---

### coach-chat

AI coaching with OpenAI GPT-4 integration and tier-based routing.

**Endpoint**: `https://your-project.supabase.co/functions/v1/coach-chat`

#### Request

```typescript
interface CoachChatRequest {
  user_id: string
  user_feedback: string
  workout_data?: WorkoutExercise[]
  progress_history?: WorkoutExercise[]
  subscription_tier: 'foundation' | 'momentum' | 'mastery'
  coaching_type: 'static' | 'dynamic'
}
```

#### Response

```typescript
interface CoachChatResponse {
  success: boolean
  message: string
  tts_message: string
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory'
  confidence: number
  suggestions?: string[]
  error?: string
}
```

---

## External Integrations

### N8N Workflow Integration

AI coaching pipeline for Mastery tier users.

```typescript
// N8N webhook request
const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: user.id,
    user_feedback: userMessage,
    workout_data: currentWorkoutData,
    progress_history: recentWorkouts,
    user_profile: {
      subscription_tier: tier,
      fitness_level: profile.fitness_level,
      current_week: currentWeek
    }
  })
})
```

### OpenAI.fm TTS API

Premium TTS service with enhanced voice quality.

```typescript
// Direct API call (handled by Edge Function)
const response = await fetch('https://openai.fm/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_FM_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'tts-1',
    input: text,
    voice: 'ash',
    speed: speed,
    instructions: contextInstructions[context]
  })
})
```

---

## Type Definitions

### Core Types

```typescript
// Exercise data structure
interface WorkoutExercise {
  id: string
  user_id: string
  workout_local_date_time: string
  workout_type: 'Push' | 'Pull'
  week_number: number
  exercise_name: string
  band_color: 'White' | 'Light Gray' | 'Dark Gray' | 'Black' | 'Elite'
  full_reps: number
  partial_reps: number
  notes: string | null
  created_at: string
}

// User profile
interface Profile {
  id: string
  x3_start_date: string
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  subscription_tier: 'foundation' | 'momentum' | 'mastery'
  created_at: string
  updated_at: string
}

// UI settings
interface UserUISettings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'auto'
  tts_enabled: boolean
  tts_voice: string
  tts_speed: number
  tts_volume: number
  rest_timer_enabled: boolean
  cadence_enabled: boolean
  created_at: string
  updated_at: string
}
```

### Component Props

```typescript
// Exercise card props
interface ExerciseCardProps {
  exercise: {
    name: string
    exercise_name: string
    band: string
    fullReps: number
    partialReps: number
    notes: string
  }
  index: number
  isActive: boolean
  onSave: (index: number, data: ExerciseData) => Promise<void>
  onStart: (index: number) => void
  loading?: boolean
  error?: string
}

// TTS settings
interface TTSSettings {
  enabled: boolean
  voice: string
  speed: number
  volume: number
  source: 'openai' | 'webspeech' | 'browser' | 'test'
}
```

### API Responses

```typescript
// Supabase query response
interface SupabaseResponse<T> {
  data: T[] | null
  error: PostgrestError | null
  count?: number
}

// TTS response
interface TTSResponse {
  success: boolean
  audio_url?: string
  error?: string
  source: string
}

// Coaching response
interface CoachingResponse {
  success: boolean
  message: string
  tts_message: string
  tone: string
  confidence: number
  suggestions?: string[]
  error?: string
}
```

---

## Error Handling Patterns

### Standard Error Response

```typescript
interface APIError {
  error: string
  message: string
  code?: string
  details?: Record<string, any>
}

// Example error handling
try {
  const result = await apiCall()
  return result
} catch (error) {
  console.error('API call failed:', error)
  
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
    code: error?.code,
    details: error?.details
  }
}
```

### TTS Error Fallback

```typescript
// TTS with automatic fallback
async function speakWithFallback(text: string, context: string) {
  try {
    // Try OpenAI.fm TTS
    await speakOpenAIFM(text, context)
  } catch (error) {
    console.warn('OpenAI.fm TTS failed, falling back to Web Speech:', error)
    
    try {
      // Try Web Speech API
      await speakWebSpeech(text)
    } catch (error2) {
      console.warn('Web Speech failed, falling back to browser TTS:', error2)
      
      // Final fallback to browser TTS
      await speakBrowserTTS(text)
    }
  }
}
```

---

## Rate Limiting & Performance

### API Rate Limits
- **OpenAI.fm TTS**: 100 requests/minute per API key
- **N8N Workflow**: 60 requests/minute per webhook
- **Supabase**: 100 concurrent connections
- **Coach Chat**: 10 requests/minute per user

### Performance Considerations

```typescript
// Debounced API calls
import { debounce } from 'lodash'

const debouncedCoachRequest = debounce(async (message: string) => {
  await sendCoachingRequest(message)
}, 1000) // 1 second debounce

// Cached responses
const responseCache = new Map<string, CoachingResponse>()

async function getCachedCoachingResponse(message: string) {
  if (responseCache.has(message)) {
    return responseCache.get(message)
  }
  
  const response = await getCoachingResponse(message)
  responseCache.set(message, response)
  
  return response
}
```

---

**Last Updated**: January 2025  
**Version**: 2.1.0 (Post-Component Refactoring)  
**API Version**: v1