# X3 Momentum Pro - Complete Project Specifications & Development Guide

**Version**: 1.1  
**Date**: January 2025  
**Status**: Active Development - Post-Cleanup Phase

---

## 🚀 Quick Development Start

### Setup Commands
1. `npm install` (if first time)
2. `npm run dev` (faster compilation without Turbopack)
3. Open http://localhost:3000

### Alternative Dev Commands
- `npm run dev` - Standard Next.js dev server (recommended)
- `npm run dev:turbo` - With Turbopack (slower initial compilation)
- `npm run dev:fast` - Explicit port 3000 binding

### If localhost doesn't work:
1. Check terminal for actual server address
2. Try http://127.0.0.1:3000
3. Try the network address shown in terminal
4. Kill port conflicts: `lsof -ti:3000 | xargs kill -9`
5. Clear cache: `rm -rf .next`
6. Restart: `npm run dev`

### Common Development Fixes:
- **Server appears to timeout**: It's actually still compiling! Wait for "✓ Ready" message
- **Cache issues**: `rm -rf .next && npm run dev`
- **Dependencies**: `rm -rf node_modules && npm install`
- **Port conflicts**: Try `npm run dev -- --port 3001`

### Troubleshooting Localhost
The most common issue is browser cache. Try:
1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. Incognito/private browsing window
3. Different browser
4. Clear all site data for localhost in DevTools

### Network Addresses
If localhost fails, the terminal shows alternative addresses:
- Network: Usually your local IP (192.168.x.x or 10.x.x.x)
- 127.0.0.1: Direct loopback address
- 0.0.0.0: All interfaces (when using --hostname 0.0.0.0)

---

## 🎨 Design System & Brand Guidelines

### Fire Theme Brand Guidelines
- ✅ Light gray page background (#FAFAFA)
- ✅ White hero banner with fire orange wordmark
- ✅ Pure white Material Design cards with gray borders
- ✅ Fire orange accents only (no gradients on content)
- ✅ Proper contrast and accessibility

### Color Palette
- **Fire Orange**: #FF6B35 (primary actions, accents)
- **Ember Red**: #FF4136 (secondary accents)
- **Page Background**: #FAFAFA (light gray)
- **Card Background**: #FFFFFF (pure white)
- **Text Primary**: #1A1A1A (dark gray)
- **Text Secondary**: #666666 (medium gray)

---

## 📐 Navigation Structure (ALL PAGES) - CRITICAL LAYOUT

### Hero Banner FIRST, Navigation SECOND
```
┌─ Hero Banner (ALWAYS FIRST) ──────────────────────┐
│ 🔥 X3 MOMENTUM (fire orange) PRO (ember red)     │
│ AI-Powered Resistance Band Tracking (gray text)  │
└─────────────────────────────────────────────────┘
┌─ Navigation (UNDER hero banner) ──────────────────┐
│ [🔥 Workout] [📊 Stats] [🎯 Goals] [📅 Calendar] │
└─────────────────────────────────────────────────┘
```

### Button Labeling & Active States
- **Home button labeled "Workout"** everywhere (never "Home")
- **Active page button**: Solid orange background (#FF6B35) with white text
- **Inactive buttons**: White background with orange text and orange border

---

## 📊 Dashboard Data Logic - MAJOR CORRECTIONS

### REMOVE Fake Dashboard Stats Cards
❌ **DELETE COMPLETELY**: The 4 cards showing:
- Fire Streak: X days
- Week Progress: X%
- Total Workouts: X
- Strength Gain: +X%

**These cards contain fabricated data and confuse users.**

### Real Data Only Policy
✅ **Show ONLY data from Supabase workout_exercises table**
✅ **Calculate metrics from actual user data**
❌ **NO fabricated or placeholder statistics**

---

## 🔥 Streak Calculation Logic - CORRECTED

### Current (Wrong) Logic:
- Only counts workout completion days
- Ignores rest days in schedule

### Correct Logic:
```javascript
function calculateStreak(userStartDate, workoutHistory) {
  // Streak = consecutive days following X3 schedule
  // Includes rest days as "successful" schedule adherence
  
  let streak = 0;
  let currentDate = new Date();
  
  for (let day = currentDate; day >= userStartDate; day--) {
    const scheduledWorkout = getScheduledWorkout(day, userStartDate);
    const actualWorkout = workoutHistory.find(w => w.date === day);
    
    if (scheduledWorkout === 'Rest') {
      streak++; // Rest days count toward streak
    } else if (actualWorkout && actualWorkout.type === scheduledWorkout) {
      streak++; // Completed scheduled workout
    } else {
      break; // Missed day breaks streak
    }
  }
  
  return streak;
}
```

---

## 📈 Stats Page Data Requirements - CORRECTED

### Remove Fabricated Sections
- ❌ **Remove "Workout Breakdown"** (Push/Pull counts are meaningless)
- ❌ **Remove fake "Band Progression"** without real progression logic
- ❌ **Remove "Strength Gain"** metric (no measurement system)

### Recent Activity Section - FIXED FORMAT
**OLD (Wrong) Format:**
```
Push Workout - 7/5/2025
Primary Band: Dark Gray
4 exercises
```

**NEW (Correct) Format:**
```
7/5/2025 Push Workout - 4 exercises
Exercises:
- Chest Press: 35+3 (Dark Gray band)
- Tricep Press: 34+4 (Dark Gray band)
- Overhead Press: 11+4 (White band)
- Front Squat: 37+0 (Light Gray band)
```

### Band Color Coding (Individual Exercises)
```css
/* Individual exercise band colors */
.exercise-white-band { 
  background: #FFFFFF; 
  color: #000000; 
  border: 2px solid #000000; 
}

.exercise-light-gray-band { 
  background: #D3D3D3; 
  color: #000000; 
  border: 2px solid #666666; 
}

.exercise-dark-gray-band { 
  background: #303030; 
  color: #FFFFFF; 
  border: 2px solid #303030; 
}

.exercise-black-band { 
  background: #000000; 
  color: #FFFFFF; 
  border: 2px solid #000000; 
}
```

---

## ⏰ Missed Workout Logic (Dr. Jaquish Methodology)

### Missed Day Handling Rules:
1. **1-7 missed days**: Continue where left off
   - "Pick up where you left off - consistency is key!"
   - Show missed workout type for today instead of scheduled

2. **8+ missed days**: Prompt to restart
   - "Consider restarting your 12-week program for best results"
   - Offer choice: Continue or Restart

### Implementation Logic:
```javascript
function getTodaysWorkout(startDate, lastWorkoutDate) {
  const daysMissed = calculateDaysMissed(lastWorkoutDate);
  const scheduledWorkout = calculateScheduledWorkout(startDate);
  
  if (daysMissed >= 8) {
    return {
      type: 'restart_prompt',
      message: 'Consider restarting for best results'
    };
  } else if (daysMissed >= 1) {
    return {
      type: getLastMissedWorkout(lastWorkoutDate),
      message: 'Complete your missed workout first'
    };
  } else {
    return {
      type: scheduledWorkout,
      message: 'Today\'s scheduled workout'
    };
  }
}
```

---

## 🗄️ Data Integration Requirements

### Real Data Sources Only
- **workout_exercises table**: All workout history and statistics
- **profiles table**: User start date, program week calculation
- **NO placeholder data**: Everything must come from database

### Calculations from Real Data:
```javascript
// Total Workouts: Count of workout_exercises records
const totalWorkouts = workoutHistory.length;

// Current Week: Calculate from start date
const currentWeek = Math.floor(daysSinceStart / 7) + 1;

// Week Progress: Based on actual schedule
const weekProgress = (completedThisWeek / scheduledThisWeek) * 100;

// Streak: Include rest days in calculation
const streak = calculateConsistencyStreak(startDate, workoutHistory);
```

---

## 🔧 Component Architecture (Post-Refactor)

### Main Page Structure (`src/app/page.tsx`) - NEEDS REFACTORING
**Current Issues:**
- 1,000+ line monolithic component
- Multiple overlapping state systems
- Complex useEffect dependencies
- Conflicting TTS integration points

**Proposed Refactor:**
```typescript
// Proposed component structure:
├── WorkoutPage.tsx (main orchestrator)
├── ExerciseCard.tsx (individual exercise UI)
├── CadenceControl.tsx (cadence functionality)
├── RestTimer.tsx (timer logic)
├── ExerciseFlow.tsx (state management)
└── WorkoutSession.tsx (session handling)
```

### Key Components to Extract:
1. **ExerciseCard Component**
   - Individual exercise state management
   - Form inputs and validation
   - Save/loading states
   - Error handling

2. **CadenceControl Component**
   - Metronome functionality
   - Audio feedback
   - Start/stop controls

3. **RestTimer Component**
   - 90-second countdown
   - TTS announcements
   - Auto-progression logic

4. **ExerciseFlow Component**
   - Exercise state orchestration
   - Transition management
   - Completion handling

---

## 🎯 Priority Implementation Order

### Phase 1: Critical Layout Fixes (IMMEDIATE)
1. **Move navigation under hero banner**
2. **Remove fake dashboard stats cards**
3. **Fix Recent Activity format**
4. **Implement real streak calculation**

### Phase 2: Component Refactoring (HIGH PRIORITY)
1. **Extract ExerciseCard component from page.tsx**
2. **Separate CadenceControl logic**
3. **Isolate RestTimer functionality**
4. **Clean up useEffect dependencies**
5. **Remove deprecated code paths**

### Phase 3: Data Accuracy (NEXT)
1. **Connect all metrics to real Supabase data**
2. **Implement missed workout detection**
3. **Fix week progress calculation**
4. **Remove strength gain metric**

### Phase 4: Enhanced Features (FUTURE)
1. **Add restart program option**
2. **Implement proper progression tracking**
3. **Add motivational messaging for missed workouts**

---

## 🧪 Testing & Verification

### Testing Verification Checklist
After corrections, verify:
- [ ] Hero banner appears first, navigation second
- [ ] No fake dashboard statistics visible
- [ ] Stats page shows only real workout data
- [ ] Recent activity shows individual exercises with band colors
- [ ] Streak includes rest days in calculation
- [ ] Week progress matches actual X3 schedule
- [ ] No "strength gain" percentage displayed
- [ ] Missed workout logic follows Dr. Jaquish methodology

### Manual Testing Procedure
1. **Foundation Tier**: Verify no audio plays, no premium features
2. **Momentum Tier**: Test basic audio cues and rest timer
3. **Mastery Tier**: Test enhanced audio feedback
4. **Exercise Flow**: Test start → in progress → complete → save
5. **Rest Timer**: Test 90-second timer with TTS countdown
6. **Cadence**: Test 2-second metronome functionality

### Dead Code Detection
Run these commands to find unused code:
```bash
# Find unused imports
npx ts-prune

# Find unused variables
npx eslint . --ext .ts,.tsx --rule 'no-unused-vars: error'

# Find unreferenced files
npx unimported
```

---

## 📝 Code Standards & Best Practices

### React Best Practices
- Use functional components with hooks
- Extract custom hooks for complex logic
- Minimize useEffect dependencies
- Use TypeScript for type safety
- Follow component composition over inheritance

### State Management Guidelines
- Keep state as local as possible
- Use context for widely-shared state
- Avoid prop drilling beyond 2-3 levels
- Use reducers for complex state logic

### Performance Considerations
- Memoize expensive calculations
- Use React.memo for pure components
- Optimize re-renders with proper dependencies
- Lazy load non-critical components

---

## 🚨 Known Issues & Technical Debt

### High Priority Issues
1. **Main page complexity**: 1,000+ line component needs refactoring
2. **Multiple exercise state systems**: Consolidate into single state machine
3. **Conflicting TTS paths**: Remove deprecated speakText function
4. **Complex useEffect chains**: Simplify dependencies and cleanup

### Medium Priority Issues
1. **Subscription tier detection**: Scattered throughout codebase
2. **Test mode complexity**: Consider separating from production code
3. **Error handling**: Inconsistent error states across components

### Low Priority Issues
1. **Console logging**: Remove debug logs from production
2. **CSS optimization**: Consolidate duplicate styles
3. **Asset optimization**: Compress images and optimize fonts

---

**This document serves as the complete source of truth for X3 Momentum Pro development. All development decisions should reference these specifications.**

---

**Last Updated**: January 2025  
**Version**: 1.1 (Post-Cleanup)  
**Status**: Active Development - Component Refactoring Phase
