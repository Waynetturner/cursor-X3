export type TimeRange = 'last-two' | 'week' | 'month' | '6months' | 'all';

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  'last-two': 'Last 2 Workouts',
  'week': 'Past Week',
  'month': 'Past Month', 
  '6months': 'Past 6 Months',
  'all': 'All Workouts'
};

export interface Exercise {
  exercise_name: string;
  band_color: 'Ultra Light' | 'White' | 'Light Gray' | 'Dark Gray' | 'Black' | 'Elite';
  full_reps: number;
  partial_reps: number;
}

export interface Workout {
  id: string;
  date: string;
  workout_type: 'Push' | 'Pull';
  exercises: Exercise[];
}

export interface WorkoutHistoryProps {
  refreshTrigger?: number;
  maxDisplay?: number;
  defaultRange?: TimeRange;
  showAllControls?: boolean;
  showTitle?: boolean;
  compact?: boolean;
}

export interface WorkoutCardProps {
  workout: Workout;
  allWorkouts: Workout[];
  compact?: boolean;
}

export interface UseWorkoutHistoryReturn {
  workouts: Workout[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
