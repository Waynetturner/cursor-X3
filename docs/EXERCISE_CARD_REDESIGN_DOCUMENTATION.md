# Exercise Card Redesign & App Structure Documentation

## Overview
This document defines the final implementation of the exercise card redesign and unified app structure for X3 Tracker.

## App Structure

### Unified Dashboard
- **Root page (`/`)**: Primary dashboard serving as both landing page and workout interface
- **Dashboard redirect (`/dashboard`)**: Redirects to root page to eliminate confusion
- **Workout redirect (`/workout`)**: Redirects to root page to eliminate confusion
- **Single source of truth**: All workout functionality accessed from root page

### Navigation Flow
```
User Signs In → Root Page (/) → Complete Workout → Stats/Settings (via nav)
                     ↑
            All workout buttons redirect here
```

## Exercise Card Design Specifications

### Exercise Name Display
- **Size**: 25% larger than base text (22.5px vs 18px)
- **Alignment**: Centered
- **Case**: ALL UPPERCASE
- **Format**: `EXERCISE NAME (highest_rep_count)`
- **Examples**: 
  - `DEADLIFT (28)`
  - `CHEST PRESS (24)`
  - `BENT ROW (33)`

### Rep Count Logic
The number in parentheses shows the **highest Full Rep count** achieved with the **current band** (highest band used for that exercise).

**Band Hierarchy (lowest to highest):**
1. Ultra Light
2. White  
3. Light Gray
4. Dark Gray
5. Black
6. Elite

**Data Source**: 
- Uses `getWorkoutHistoryData()` function from `@/lib/exercise-history`
- Analyzes all historical data for each exercise
- Finds highest band used per exercise
- Shows highest Full Rep count achieved with that band
- Pre-selects that band in the dropdown

### Card Layout Structure
```
┌─────────────────────────────────────┐
│  [Info Icon - Top Right]            │
│                                     │
│        EXERCISE NAME (XX)           │ ← 25% larger, centered, ALL CAPS
│                                     │
│  Band Color Dropdown               │ ← Pre-selected to highest band used
│                                     │
│  [Full Reps Input] [Partial Reps]  │
│                                     │
│  Notes Textarea                     │
│                                     │
│  Exercise Status (if active)        │
│                                     │
│  [Save Exercise Button]             │ ← Always at bottom
└─────────────────────────────────────┘
```

## Workout Flow Controls

### Start Exercise Button Location
- **Position**: Below Cadence section, NOT in individual exercise cards
- **Styling**: Green button with Play icon
- **Functionality**: Starts first exercise in sequence
- **Visibility**: Only shown when no exercises are active

### Cadence Section Layout
```
┌─────────────────────────────────────┐
│          🎵 Workout Cadence         │
│                                     │
│     [Start Cadence (2s)] Button     │ ← Orange cadence button
│                                     │
│  Audio metronome to help maintain   │
│    proper exercise timing           │
│                                     │
│        ▼ START EXERCISE ▼           │ ← Green start button HERE
│                                     │
│     [▶ Start Exercise] Button       │ ← Triggers workout sequence
│                                     │
│   Begin the full Pull workout       │
│         sequence                    │
└─────────────────────────────────────┘
```

## Exercise Timer Flow

### Sequence
1. User clicks **Start Exercise** (below cadence)
2. System starts first exercise (index 0)
3. Exercise card shows "Exercise Starting..." status
4. TTS speaks exercise start phrase (if enabled)
5. Exercise state changes to "in_progress"
6. Cadence automatically starts
7. User completes reps and clicks **Save Exercise** in card
8. Exercise marked as completed
9. 90-second rest timer starts (if premium)
10. Next exercise auto-starts after rest period
11. Repeat until all exercises completed

### Button States
- **Start Exercise**: Only visible when no exercises active
- **Save Exercise**: In each card, triggers completion and next exercise
- **Cadence**: Independent control, can be started/stopped anytime

## Data Flow

### Exercise Data Structure
```typescript
interface Exercise {
  // Database fields
  exercise_name: string
  band_color: string  
  full_reps: number
  partial_reps: number
  
  // UI display fields  
  name: string        // "DEADLIFT (28)" or "DEADLIFT" 
  band: string        // Pre-selected highest band
  fullReps: number    // Input field value
  partialReps: number // Input field value
}
```

### History Data Integration
- `setupExercises()` calls `getWorkoutHistoryData(exerciseNames)`
- History data returns `{ exerciseName: { displayText, highestBand, highestReps } }`
- Exercise cards show `displayText` as name (includes rep count)
- Band dropdown pre-selects `highestBand`
- No duplicate numbers in display

## Implementation Notes

### Key Functions
- `getWorkoutHistoryData()`: Analyzes exercise history with band hierarchy
- `startExercise()`: Initiates exercise timer sequence  
- `saveExercise()`: Completes exercise and triggers next
- `setupExercises()`: Builds exercise data with history integration

### Component Responsibilities
- **ExerciseCard**: Display exercise data, handle input, save completion
- **CadenceButton**: Audio metronome control
- **Root Page**: Workout orchestration, timer management, exercise sequence

### Critical Rules
1. Start Exercise button NEVER goes in individual exercise cards
2. Exercise names include rep count from history data - don't duplicate
3. Root page is the single dashboard - other pages redirect
4. Band hierarchy determines "highest" band selection
5. Exercise sequence flows automatically with rest timers

## Testing Checklist

✅ Exercise names show as "EXERCISE (XX)" format  
✅ No duplicate numbers in exercise names  
✅ Start Exercise button below cadence section  
✅ Exercise timer flow works end-to-end  
✅ Band dropdowns pre-select highest band used  
✅ All pages redirect to unified root dashboard  
✅ Rest timer auto-starts next exercise  
✅ TTS integration works with exercise flow
