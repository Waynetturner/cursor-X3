export type TimeRange = '7days' | '1month' | '3months' | 'alltime';

export interface TimeRangeOption {
  key: TimeRange;
  label: string;
}

export interface ExerciseDetail {
  name: string;
  fullReps: number;
  partialReps: number;
  bandColor: string;
}

export interface RecentWorkout {
  date: string;
  type: string;
  exercises: number;
  exerciseDetails: ExerciseDetail[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  currentWeek: number;
  currentStreak: number;
  longestStreak: number;
  totalExercises: number;
  averageRepsPerExercise: number;
  mostUsedBand: string;
  workoutsByType: {
    Push: number;
    Pull: number;
  };
  recentWorkouts: RecentWorkout[];
}

export interface StatsPageState {
  user: { id: string; email?: string } | null;
  stats: WorkoutStats | null;
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
}

export interface StatsError {
  message: string;
  code?: string;
  details?: {
    stack?: string;
    cause?: unknown;
    statusCode?: number;
  };
}

export interface UseUserStatsResult {
  stats: WorkoutStats | null;
  loading: boolean;
  error: StatsError | null;
  refetch: () => Promise<void>;
}