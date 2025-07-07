# X3 Momentum Pro - Updated Current Specifications v1.1

**Version**: 1.1  
**Date**: July 6, 2025  
**Status**: Active Development - CRITICAL LAYOUT FIXES REQUIRED

---

## Navigation Structure (ALL PAGES) - UPDATED

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

### Button Labeling & Active States (UNCHANGED)
- **Home button labeled "Workout"** everywhere (never "Home")
- **Active page button**: Solid orange background (#FF6B35) with white text
- **Inactive buttons**: White background with orange text and orange border

---

## Dashboard Data Logic - MAJOR CORRECTIONS

### REMOVE Fake Dashboard Stats Cards
❌ **DELETE COMPLETELY**: The 4 cards showing:
- Fire Streak: X days
- Week Progress: X%
- Total Workouts: X
- Strength Gain: +X%

These cards contain fabricated data and confuse users.

### Real Data Only Policy
✅ **Show ONLY data from Supabase workout_exercises table**
✅ **Calculate metrics from actual user data**
❌ **NO fabricated or placeholder statistics**

---

## Streak Calculation Logic - CORRECTED

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

## Stats Page Data Requirements - CORRECTED

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

## Missed Workout Logic (Dr. Jaquish Methodology)

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

## Data Integration Requirements - UPDATED

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

## Priority Implementation Order

### Phase 1: Critical Layout Fixes (IMMEDIATE)
1. **Move navigation under hero banner**
2. **Remove fake dashboard stats cards**
3. **Fix Recent Activity format**
4. **Implement real streak calculation**

### Phase 2: Data Accuracy (NEXT)
1. **Connect all metrics to real Supabase data**
2. **Implement missed workout detection**
3. **Fix week progress calculation**
4. **Remove strength gain metric**

### Phase 3: Enhanced Features (FUTURE)
1. **Add restart program option**
2. **Implement proper progression tracking**
3. **Add motivational messaging for missed workouts**

---

## Testing Verification Checklist

After corrections, verify:
- [ ] Hero banner appears first, navigation second
- [ ] No fake dashboard statistics visible
- [ ] Stats page shows only real workout data
- [ ] Recent activity shows individual exercises with band colors
- [ ] Streak includes rest days in calculation
- [ ] Week progress matches actual X3 schedule
- [ ] No "strength gain" percentage displayed
- [ ] Missed workout logic follows Dr. Jaquish methodology

---

**This document overrides any conflicting information. Use these specifications as the source of truth for immediate development fixes.**
