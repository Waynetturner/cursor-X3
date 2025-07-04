
export interface Exercise {
  exercise_name: string;
  full_reps: number;
  partial_reps: number;
  band_color: string;
  notes?: string;
}

export interface Workout {
  id: number;
  date: string;
  workout_type: string;
  week_number: number;
  created_at: string;
  user_id: string; // Added user_id to the type definition
  exercises: Exercise[];
}

export type TimeRange = 'week' | 'month' | '3months' | '6months' | 'all';

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  week: 'Previous Week',
  month: 'Previous Month',
  '3months': 'Previous 3 Months',
  '6months': 'Previous 6 Months',
  all: 'All History'
};
