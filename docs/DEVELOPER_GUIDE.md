# X3 Momentum Pro - Developer Guide

**Version**: 2.1.0  
**Date**: January 2025  
**Target Audience**: Developers working on the X3 Momentum Pro codebase

---

## Quick Start

### Prerequisites
- **Node.js**: 18+ with npm
- **Git**: Latest version
- **Supabase CLI**: For Edge Functions deployment
- **Code Editor**: VS Code recommended with TypeScript extensions

### Development Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd x3-tracker
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
Create `.env.local` file in project root:
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

# N8N Integration (for coaching)
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url

# Debug Flags (optional)
NEXT_PUBLIC_DEBUG_BACKEND=false
NEXT_PUBLIC_DEBUG_TTS=false
NEXT_PUBLIC_DEBUG_COACHING=false
```

#### 4. Start Development Server
```bash
# Standard development server (recommended)
npm run dev

# Alternative commands
npm run dev:turbo    # With Turbopack (slower initial compilation)
npm run dev:fast     # Explicit port 3000 binding
```

#### 5. Verify Setup
- Navigate to `http://localhost:3000`
- Check browser console for errors (should be zero)
- Test basic functionality (login, dashboard view)

---

## Development Commands

### Core Commands
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript validation

# Supabase (requires Supabase CLI)
supabase login          # Authenticate with Supabase
supabase link          # Link to project
supabase functions deploy generate-speech  # Deploy TTS function
supabase functions deploy coach-chat       # Deploy coaching function
```

### Troubleshooting Commands
```bash
# Clear Next.js cache
rm -rf .next && npm run dev

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install

# Check port conflicts
lsof -ti:3000 | xargs kill -9

# Check Supabase functions
supabase functions list
supabase functions logs generate-speech --follow
```

---

## Project Structure

### Directory Organization
```
x3-tracker/
├── public/                          # Static assets
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── page.tsx                 # Main workout dashboard
│   │   ├── stats/page.tsx          # Progress analytics
│   │   ├── goals/page.tsx          # Goal setting
│   │   ├── calendar/page.tsx       # Program calendar
│   │   ├── settings/page.tsx       # User settings
│   │   ├── globals.css             # Global styles
│   │   └── layout.tsx              # Root layout
│   ├── components/                  # Reusable components
│   │   ├── ExerciseCard/           # Exercise tracking component
│   │   ├── CadenceButton/          # Cadence control component
│   │   ├── RestTimer/              # Rest timer component
│   │   ├── CoachChat/              # AI coaching interface
│   │   ├── AICoaching/             # AI coaching system
│   │   └── TTSSettings/            # TTS configuration
│   ├── hooks/                       # Custom React hooks
│   │   ├── useX3TTS.ts             # TTS system integration
│   │   ├── useRestTimer.ts         # Rest timer functionality
│   │   └── useSubscription.ts      # Subscription management
│   ├── lib/                         # Utility libraries
│   │   ├── supabase.ts             # Supabase client
│   │   ├── coaching-service.ts     # AI coaching service
│   │   ├── test-mode.ts            # Test mode utilities
│   │   ├── timezone.ts             # Timezone handling
│   │   ├── tts-phrases.ts          # TTS phrase library
│   │   └── exercise-history.ts     # Exercise data analysis
│   ├── contexts/                    # React contexts
│   │   ├── SubscriptionContext.tsx # Subscription state
│   │   └── ThemeContext.tsx        # Theme management
│   └── types/                       # TypeScript type definitions
├── supabase/                        # Supabase configuration
│   ├── functions/                   # Edge Functions
│   │   ├── generate-speech/         # TTS function
│   │   └── coach-chat/             # AI coaching function
│   └── migrations/                  # Database migrations
├── docs/                           # Documentation
└── package.json                    # Dependencies and scripts
```

### Key Files Explained

#### Core Application Files
- **`src/app/page.tsx`**: Main workout dashboard (recently refactored from 1000+ lines)
- **`src/app/layout.tsx`**: Root layout with providers and navigation
- **`src/lib/supabase.ts`**: Supabase client configuration and utilities

#### Component Architecture (Post-Refactoring)
- **`ExerciseCard/`**: Modular exercise tracking with band selection and rep input
- **`CadenceButton/`**: Independent cadence control with audio feedback
- **`RestTimer/`**: 90-second timer with TTS announcements
- **`CoachChat/`**: AI coaching chat interface with N8N integration

#### Service Layer
- **`coaching-service.ts`**: AI coaching request handling with fallbacks
- **`test-mode.ts`**: SSR-safe mock data system for development
- **`timezone.ts`**: Central timezone handling (America/Chicago)

---

## Development Workflow

### Component Development Pattern

#### 1. Create Component Structure
```typescript
// src/components/NewComponent/NewComponent.tsx
import React from 'react'

interface NewComponentProps {
  // Define props with TypeScript
  title: string
  onAction?: () => void
}

export default function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {onAction && (
        <button 
          onClick={onAction}
          className="mt-4 bg-fire-orange text-white px-4 py-2 rounded-lg"
        >
          Action
        </button>
      )}
    </div>
  )
}

// src/components/NewComponent/index.ts
export { default } from './NewComponent'
```

#### 2. Custom Hook Pattern
```typescript
// src/hooks/useNewFeature.ts
import { useState, useEffect } from 'react'

export function useNewFeature() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performAction = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Perform action
      const result = await someAsyncOperation()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    performAction
  }
}
```

#### 3. Timezone-Aware Development Pattern 
```typescript
// src/lib/timezone-helpers.ts
import { supabase } from './supabase'

/**
 * Get user's today in their local timezone
 * ALWAYS use this instead of new Date() for user-facing dates
 */
export async function getUserToday(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single()
  
  const userTimezone = profile?.timezone || 'America/Chicago'
  return new Date().toLocaleDateString('en-CA', { timeZone: userTimezone })
}

/**
 * Get user's current date and time in their timezone
 */
export async function getUserDateTime(userId: string): Promise<Date> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single()
  
  const userTimezone = profile?.timezone || 'America/Chicago'
  
  // Create Date in user's timezone
  const now = new Date()
  const userDateString = now.toLocaleString('en-CA', { 
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/,\s/, 'T')
  
  return new Date(userDateString)
}

// Usage Examples:
const userToday = await getUserToday(userId)
const userDateTime = await getUserDateTime(userId)
```

#### 4. Service Layer Pattern
```typescript
// src/lib/new-service.ts
import { supabase } from './supabase'
import { getUserToday } from './timezone-helpers'

export class NewService {
  async getData(userId: string) {
    // ALWAYS use user's timezone for date operations
    const today = await getUserToday(userId)
    
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data
  }

  async saveData(userId: string, data: any) {
    const { error } = await supabase
      .from('table_name')
      .insert({ user_id: userId, ...data })

    if (error) throw error
  }
}

export const newService = new NewService()
```

### Database Integration

#### Supabase Client Usage
```typescript
import { supabase } from '@/lib/supabase'

// Query data
const { data, error } = await supabase
  .from('workout_exercises')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

// Insert data
const { error } = await supabase
  .from('workout_exercises')
  .insert({
    user_id: user.id,
    exercise_name: 'Deadlift',
    full_reps: 25,
    partial_reps: 3
  })

// Real-time subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('workout_changes')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'workout_exercises' },
      (payload) => {
        console.log('New workout logged:', payload.new)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

---

## Code Standards & Best Practices

### TypeScript Guidelines

#### Interface Definitions
```typescript
// Use interfaces for props and data structures
interface WorkoutExercise {
  id: string
  exercise_name: string
  band_color: 'White' | 'Light Gray' | 'Dark Gray' | 'Black' | 'Elite'
  full_reps: number
  partial_reps: number
  notes?: string
}

// Use proper typing for component props
interface ComponentProps {
  data: WorkoutExercise[]
  onSave: (exercise: WorkoutExercise) => Promise<void>
  loading?: boolean
}
```

#### Error Handling
```typescript
// Proper error handling with types
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unknown error occurred'
  
  console.error('Operation failed:', errorMessage)
  setError(errorMessage)
}
```

### React Best Practices

#### State Management
```typescript
// Use proper state initialization
const [exerciseStates, setExerciseStates] = useState<Record<number, 'idle' | 'in_progress' | 'completed'>>({})

// Update state immutably
setExerciseStates(prev => ({
  ...prev,
  [exerciseIndex]: 'completed'
}))
```

#### Effect Dependencies
```typescript
// Proper dependency arrays
useEffect(() => {
  fetchUserData()
}, [user.id]) // Include all dependencies

// Cleanup functions
useEffect(() => {
  const subscription = createSubscription()
  
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

### CSS/Styling Guidelines

#### Tailwind CSS Usage
```typescript
// Use Tailwind classes consistently
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">

// Use custom CSS variables for brand colors
<button className="bg-fire-orange hover:bg-ember-red text-white px-4 py-2 rounded-lg">

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

#### Fire Theme Compliance
```css
/* Use defined color variables */
.custom-component {
  background-color: var(--fire-orange);
  color: var(--pure-white);
  border: 1px solid var(--border-subtle);
}

/* No gradients on content areas */
.card {
  background: #FFFFFF; /* Solid white only */
  box-shadow: 0 2px 8px rgba(0,0,0,0.08); /* Subtle shadows */
}
```

---

## Testing Strategy

### Test Mode Usage
```typescript
import { testModeService } from '@/lib/test-mode'

// Check if in test mode
if (testModeService.isEnabled()) {
  // Use mock data
  return mockWorkoutData
}

// Enable test mode (in Settings → Advanced)
testModeService.enable()

// Mock specific features
if (testModeService.shouldMockTTS()) {
  console.log('🧪 Test Mode: Mock TTS played')
  return
}
```

### Manual Testing Checklist
- [ ] **Authentication**: Login/logout, Google OAuth
- [ ] **Workout Flow**: Exercise tracking, saving, progression
- [ ] **TTS System**: Audio playback across all tiers
- [ ] **AI Coaching**: Chat interface, responses, voice integration
- [ ] **Rest Timer**: 90-second countdown, audio cues
- [ ] **Subscription Tiers**: Feature gating works correctly
- [ ] **Mobile Responsiveness**: All features work on mobile
- [ ] **Error Handling**: Network errors, validation errors

### Performance Testing
```typescript
// Monitor component render performance
import { Profiler } from 'react'

function onRenderCallback(id: string, phase: string, actualDuration: number) {
  console.log(`Component ${id} took ${actualDuration}ms to ${phase}`)
}

<Profiler id="ExerciseCard" onRender={onRenderCallback}>
  <ExerciseCard {...props} />
</Profiler>
```

---

## Debugging & Troubleshooting

### Debug Mode Configuration
```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG_BACKEND=true
NEXT_PUBLIC_DEBUG_TTS=true
NEXT_PUBLIC_DEBUG_COACHING=true
```

### Common Issues & Solutions

#### 1. SSR/Hydration Issues
```typescript
// Always check for client-side before localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('key')
  // Use stored value
}

// Use dynamic imports for client-only components
import dynamic from 'next/dynamic'
const ClientOnlyComponent = dynamic(() => import('./ClientComponent'), { ssr: false })
```

#### 2. Timezone Issues
```typescript
// NEVER use these for user-facing dates:
const today = new Date().toISOString().split('T')[0] // ❌ Uses UTC
const today = new Date().toLocaleDateString() // ❌ Uses system timezone

// ALWAYS use getUserToday() pattern:
const today = await getUserToday(userId) // ✅ Uses user's timezone

// For database queries involving dates:
const { data } = await supabase
  .from('daily_workout_log')
  .select('*')
  .eq('user_id', userId)
  .eq('date', await getUserToday(userId)) // ✅ Timezone-aware

// Debugging timezone issues:
console.log('UTC now:', new Date().toISOString())
console.log('User today:', await getUserToday(userId))
console.log('User profile timezone:', profile.timezone)
```

#### 3. TTS Not Working
```typescript
// Check TTS availability
const { isTTSAvailable, error, getSourceIndicator } = useX3TTS()

if (!isTTSAvailable) {
  console.log('TTS not available:', error)
  // Show fallback UI
}

// Check subscription tier
if (!hasFeature('ttsAudioCues')) {
  console.log('TTS requires Momentum or Mastery tier')
}
```

#### 3. Database Connection Issues
```typescript
// Test Supabase connection
try {
  const { data, error } = await supabase.from('profiles').select('count')
  if (error) throw error
  console.log('✅ Supabase connected')
} catch (error) {
  console.error('❌ Supabase connection failed:', error)
}
```

#### 4. Build Errors
```bash
# Check TypeScript errors
npm run type-check

# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Logging Patterns
```typescript
// Use consistent logging patterns
console.log('🚀 Component mounted:', componentName)
console.log('📊 Data loaded:', { count: data.length })
console.log('⚠️ Warning:', warningMessage)
console.error('❌ Error:', error)
console.log('✅ Success:', successMessage)

// Debug-only logging
if (process.env.NEXT_PUBLIC_DEBUG_BACKEND === 'true') {
  console.log('🐛 Debug info:', debugData)
}
```

---

## Deployment

### Edge Functions Deployment
```bash
# Deploy TTS function
supabase functions deploy generate-speech

# Deploy coaching function
supabase functions deploy coach-chat

# Set environment secrets
supabase secrets set OPENAI_FM_API_KEY=your-key
supabase secrets set OPENAI_API_KEY=your-key

# Verify deployment
supabase functions list
supabase functions logs generate-speech
```

### Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Check bundle size
npm run build -- --analyze
```

### Environment Variables (Production)
```bash
# Required for production deployment
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_FM_API_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=
NEXT_PUBLIC_N8N_WEBHOOK_URL=
```

---

## Contribution Guidelines

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes with descriptive commits
git add .
git commit -m "feat: add new exercise tracking feature

- Extract ExerciseCard component from main page
- Add proper TypeScript interfaces
- Include loading states and error handling
- Test with all subscription tiers"

# Push and create PR
git push origin feature/new-feature-name
```

### Code Review Checklist
- [ ] **TypeScript**: Proper types and interfaces
- [ ] **Error Handling**: Comprehensive error states
- [ ] **Loading States**: User feedback for async operations
- [ ] **Accessibility**: ARIA labels and keyboard navigation
- [ ] **Mobile**: Responsive design tested
- [ ] **Performance**: No unnecessary re-renders
- [ ] **Testing**: Manual testing completed
- [ ] **Documentation**: Code comments and README updates

### Component Refactoring Guidelines
1. **Extract Single Responsibility**: Each component should have one clear purpose
2. **Preserve Functionality**: Zero regression in existing features
3. **Maintain Props Interface**: Keep external API stable
4. **Add TypeScript**: Proper interfaces and type safety
5. **Include Tests**: At minimum, manual testing checklist

---

## Architecture Decisions

### Component Architecture (Post-Refactoring)
**Decision**: Extract components from monolithic page.tsx  
**Rationale**: 1000+ line components are unmaintainable  
**Result**: ExerciseCard, CadenceButton extracted with zero functionality regression

### TTS Fallback Hierarchy
**Decision**: OpenAI.fm → Web Speech → Browser → Test Mode  
**Rationale**: Ensure audio always works regardless of API availability  
**Implementation**: Automatic fallback with user feedback

### Test Mode Design
**Decision**: SSR-safe mock data system  
**Rationale**: Safe development without affecting production data  
**Implementation**: Client-side only with proper guards

### Subscription Tier Gating
**Decision**: Feature-based access control throughout application  
**Rationale**: Clear value proposition for premium tiers  
**Implementation**: Context-based with consistent UI patterns

---

## Performance Optimization

### Bundle Size Optimization
- **Tree Shaking**: Automatic with Next.js
- **Dynamic Imports**: Client-only components
- **Code Splitting**: Automatic route-based splitting

### Runtime Performance
- **React.memo**: Pure components with expensive renders
- **useMemo/useCallback**: Expensive calculations and stable references
- **Proper Dependencies**: Optimized useEffect and callback dependencies

### Loading Optimization
- **Loading States**: Visual feedback for all async operations
- **Error Boundaries**: Graceful error handling
- **Optimistic Updates**: Immediate UI updates with rollback

---

**Last Updated**: January 2025  
**Version**: 2.1.0 (Post-Component Refactoring)  
**Maintainer**: Development Team