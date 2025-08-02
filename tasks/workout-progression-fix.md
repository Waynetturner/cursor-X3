# Workout Progression Fix: Completion-Based Model

## Problem Statement
The app currently uses calendar-based workout progression instead of completion-based progression. If a user misses a workout (e.g., Push yesterday), the app shows the next scheduled workout (Pull today) instead of the missed workout that should be completed first.

## Solution Overview
Implement completion-based workout progression following Dr. Jaquish X3 methodology:
- Users must complete current workout before advancing to next
- Missed workouts are marked but don't require make-ups or restarts
- Calendar shows actual completion status vs planned schedule
- Rest days advance automatically (passive by design)

## Implementation Plan

### Phase 1: Core Completion Logic ✅ COMPLETE

#### 1.1 Create New Completion-Based Functions
**File: `src/lib/supabase.ts`**

- [x] Add `getCompletedWorkoutDates(userId: string)` function
  - Query `workout_exercises` table for user's completed workouts
  - Group by date to identify days with completed workouts
  - Return array of completed workout dates

- [x] Add `getTodaysWorkoutWithCompletion(startDate: string, userId: string)` function
  - Get list of completed workout dates
  - Determine next required workout based on completion sequence
  - Follow X3 schedule: Push → Pull → Rest → Push → Pull → Rest → Rest (weeks 1-4)
  - Follow X3 schedule: Push → Pull → Push → Pull → Push → Pull → Rest (weeks 5+)
  - Return workout type, week, and completion status

- [x] Add `determineWorkoutCompletionStatus(workoutDate: string, userId: string)` function
  - Check if all 4 exercises completed for given date
  - Return completion status: 'complete', 'partial', 'missed', 'scheduled'

#### 1.2 Workout Completion Logic
**Completion Threshold:** Require all 4 exercises saved for workout completion
- Query count of exercises for specific date and workout type
- Push workout complete: 4 exercises (Chest Press, Tricep Press, Overhead Press, Front Squat)
- Pull workout complete: 4 exercises (Deadlift, Bent Row, Bicep Curl, Calf Raise)

#### 1.3 Rest Day Auto-Advancement
- Rest days automatically advance (no user action required)
- Rest days count as "completed" in progression logic
- Maintain existing streak calculation for rest days

### Phase 2: Database Integration ✅ TODO

#### 2.1 Completion Query Functions
**File: `src/lib/supabase.ts`**

- [ ] Add `getWorkoutCompletionHistory(userId: string, startDate: string)` function
  - Get comprehensive workout history from program start
  - Include completion status for each scheduled workout day
  - Return timeline of completed/missed/scheduled workouts

- [ ] Update existing `calculateStreak()` function
  - Modify to use completion-based logic instead of calendar-based
  - Rest days continue to count as completed
  - Missed workout days break streak appropriately

#### 2.2 Performance Optimization
- [ ] Add database indexes if needed for performance
- [ ] Cache completion data to avoid repeated database queries
- [ ] Optimize queries to only fetch necessary data

### Phase 3: Main Workout Page Updates ✅ COMPLETE

#### 3.1 Update Workout Determination Logic
**File: `src/app/workout/page.tsx`**

- [x] Replace `getTodaysWorkout(startDate)` with `getTodaysWorkoutWithCompletion(startDate, userId)`
- [x] Update component state to handle completion-based workout data
- [x] Add loading states for completion data queries

#### 3.2 Enhanced Workout Display
- [x] Update workout header to show completion status
  - "Today's Push Workout" (normal)
  - "Catch up: Push Workout" (missed workout)
  - "Today's Rest Day" (rest day)

- [x] Add contextual messaging for missed workouts
  - Header dynamically shows "Catch up: [Workout Type]" when status is 'catch_up'
  - Maintains existing motivational messaging

#### 3.3 Progress Indicators
- [x] Update week progress to show actual completions vs planned
- [x] Add "behind schedule" vs "on track" indicators (via status field)
- [x] Maintain existing exercise history and band selection logic

### Phase 4: Calendar Integration ✅ COMPLETE

#### 4.1 Add "Missed" Status Type
**File: `src/app/calendar/page.tsx`**

- [x] Add "Missed" as 4th workout status alongside Push/Pull/Rest
- [x] Update calendar rendering to display missed workouts with distinct styling
- [x] Add visual indicators: Push (orange), Pull (red), Rest (blue), Missed (gray)

#### 4.2 Calendar Data Logic
- [x] Update calendar data fetching to use completion-based logic (`getWorkoutForDateWithCompletion`)
- [x] Show actual workout status vs originally scheduled workout
- [x] Implement dynamic shifting calendar that shows shifted schedule for future dates

#### 4.3 UI Enhancements
- [x] Add visual indicator for shifted workouts (yellow ring)
- [x] Implement responsive design for missed workout indicators
- [x] Enhanced calendar displays both original and actual workout status

### Phase 5: Settings and Configuration ✅ TODO

#### 5.1 Admin/User Settings
**File: `src/app/settings/page.tsx`**

- [ ] Add completion threshold setting (optional future enhancement)
  - Option: "Require all 4 exercises" (default)
  - Option: "Require minimum 1 exercise"
- [ ] Add calendar view preferences
  - Option: Show missed workouts from program start
  - Option: Limit missed workout display to last X days

#### 5.2 Test Mode Integration
- [ ] Update test mode to work with completion-based logic
- [ ] Add mock completion data for testing
- [ ] Ensure test mode doesn't interfere with completion queries

### Phase 6: Testing and Validation ✅ TODO

#### 6.1 Scenario Testing
- [ ] Test missed single workout (Push missed → next day shows Push)
- [ ] Test missed multiple workouts (Push+Pull missed → shows Push first)
- [ ] Test normal progression (Push complete → next day shows Pull)
- [ ] Test rest day advancement (Rest day auto-advances)
- [ ] Test week transitions (week 4 to 5, schedule change)

#### 6.2 Edge Case Handling
- [ ] Test user starting mid-program
- [ ] Test user with no workout history
- [ ] Test timezone edge cases
- [ ] Test database connection failures

#### 6.3 Performance Testing
- [ ] Test with large workout history (1+ years of data)
- [ ] Verify fast page load times with completion queries
- [ ] Test calendar performance with full history

### Phase 7: Documentation and Cleanup ✅ TODO

#### 7.1 Code Documentation
- [ ] Add comprehensive JSDoc comments to new functions
- [ ] Update existing documentation to reflect completion-based logic
- [ ] Add inline comments explaining complex completion logic

#### 7.2 Migration Strategy
- [ ] Keep existing calendar-based functions as fallback
- [ ] Add feature flags to gradually roll out completion-based logic
- [ ] Ensure backwards compatibility during transition

#### 7.3 Update Project Documentation
- [ ] Update `docs/CLAUDE.md` with new completion logic
- [ ] Document completion-based workflow for future developers
- [ ] Add troubleshooting guide for completion issues

## Expected Outcomes

### User Experience Improvements
✅ **Accurate Progression**: Users see the workout they actually need to do
✅ **Clear Feedback**: Calendar shows missed vs completed workouts honestly
✅ **Motivational**: "Catch up" messaging is encouraging, not punitive
✅ **X3 Compliant**: Follows Dr. Jaquish methodology of moving forward

### Technical Benefits
✅ **Data Accuracy**: Workout progression matches actual user behavior
✅ **Scalable**: Can handle any missing workout patterns
✅ **Maintainable**: Clear separation between calendar and completion logic
✅ **Testable**: Comprehensive test scenarios for all use cases

## Files to Modify

1. **`src/lib/supabase.ts`** - Core completion logic and database queries
2. **`src/app/workout/page.tsx`** - Main workout page progression logic
3. **`src/app/calendar/page.tsx`** - Calendar display with missed status
4. **`src/app/settings/page.tsx`** - User preferences for completion settings
5. **`tasks/todo.md`** - Track implementation progress

## Success Criteria

- [ ] User misses Push workout yesterday → today shows Push (not Pull)
- [ ] Calendar shows yesterday as "Missed Push" with appropriate styling
- [ ] All existing functionality continues to work (no regressions)
- [ ] Performance remains fast with completion queries
- [ ] Test mode works with new completion logic
- [ ] Zero console errors in development and production builds

## Notes

- Implementation follows X3 methodology: progress not perfection
- No make-up workouts or doubling up encouraged
- Routine-oriented progression, not calendar-rigid
- Missed days marked honestly without program restart
- Rest days advance automatically (passive by design)
