# Code Cleanup Plan to Remove TypeScript/ESLint Warnings

## 1. Remove Unused Variables and Functions

```typescript
// In src/app/workout/page.tsx:
// Remove this entire unused function
function speakText(text: string, hasFeature: boolean) {
  // This function is deprecated - use speak() from useX3TTS instead
  console.warn('⚠️ speakText is deprecated, use speak() from useX3TTS hook')
}

// Remove unused state
const [refreshTrigger, setRefreshTrigger] = useState(0);

// Remove unused variable
const tomorrowDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

// Remove unused function
const getExerciseInfoUrl = (exerciseName: string) => { ... }
```

## 2. Fix TypeScript Type Errors

Create proper interfaces instead of using `any`:

```typescript
// In src/app/workout/page.tsx:

// Replace generic 'any' types with specific interfaces
interface UserProfile {
  id: string;
  email: string;
  // Add other user properties as needed
}

interface WorkoutData {
  workoutType: 'Push' | 'Pull' | 'Rest';
  week: number;
  dayInWeek: number;
  status?: 'completed' | 'scheduled' | 'missed' | 'catch_up';
  // Add other workout properties as needed
}

// Update state declarations
const [user, setUser] = useState<UserProfile | null>(null);
const [todaysWorkout, setTodaysWorkout] = useState<WorkoutData | null>(null);

// Fix specific type errors in function parameters
function getTodaysWorkoutWithCompletion(startDate: string, userId: string): Promise<WorkoutData> { ... }

// In src/components/AnimatedCadenceButton.tsx:
// Already fixed by adding the interface and props
```

## 3. Fix React Hook Dependencies

Update useEffect dependency arrays to include all variables used inside:

```typescript
// For the 'startExercise' dependency warning:
useEffect(() => {
  // Effect body here
}, [restTimer, exercises, exerciseStates, startExercise]); // Add missing dependencies

// For other useEffect hooks with warnings:
useEffect(() => {
  // Effect body here
}, [restTimer?.timeLeft, restTimer?.isActive, cadenceActive, restTimer?.exerciseIndex, exercises, tier, speak, setCadenceActive]);
```

## 4. Fix HTML Entity Encoding

Replace apostrophes and quotes with HTML entities:

```typescript
// Replace apostrophes
<p className="text-body mb-8">Focus on recovery, hydration, and nutrition</p>

// Changes to:
<p className="text-body mb-8">Focus on recovery, hydration, and nutrition</p>

// Replace double quotes
<span>Or continue with Google</span>

// Changes to:
<span>Or continue with Google</span>
```

## 5. Fix TypeScript Any Type in AnimatedCadenceButton

Replace the any type for the AudioContext:

```typescript
// In src/components/AnimatedCadenceButton.tsx:
const context = new (window.AudioContext || (window as any).webkitAudioContext)();

// Change to:
interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}
const context = new (window.AudioContext || ((window as AudioContextWindow).webkitAudioContext as any))();
```

## Implementation Strategy

1. Fix the critical errors first (unused variables and type errors)
2. Then address the hook dependencies
3. Finally fix HTML entity encoding issues

This approach will gradually reduce the error count while maintaining app functionality.
