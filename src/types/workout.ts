// Workout types for the X3 Tracker application

import { User } from '@supabase/auth-helpers-nextjs'

// Band types
export type BandColor = 'Ultra Light' | 'White' | 'Light Gray' | 'Dark Gray' | 'Black' | 'Elite'
export type WorkoutType = 'Push' | 'Pull' | 'Rest'
export type ExerciseState = 'idle' | 'started' | 'in_progress' | 'completed'

// User type (properly typed instead of any)
export interface AuthenticatedUser extends User {
  id: string
  email?: string
}

// Workout information
export interface WorkoutInfo {
  week: number
  workoutType: WorkoutType
  dayInWeek: number
  status: 'current' | 'catch_up' | 'scheduled'
  missedWorkouts: number
}

// Exercise interface (improved from existing one)
export interface Exercise {
  id?: string
  exercise_name: string
  band_color: BandColor
  full_reps: number
  partial_reps: number
  notes: string
  saved: boolean
  previousData?: {
    band_color?: string;
    full_reps?: number;
    partial_reps?: number;
    workout_date?: string;
  }
  workout_local_date_time: string
  name: string // Display name with PR info
  band: BandColor // For UI component
  fullReps: number // For UI component
  partialReps: number // For UI component
  lastWorkout: string // Last workout summary
  lastWorkoutDate: string // Formatted date
}

// Rest timer state
export interface RestTimerState {
  isActive: boolean
  timeLeft: number
  exerciseIndex: number
}

// Loading states interfaces
export interface ExerciseLoadingStates {
  [exerciseIndex: number]: boolean
}

export interface ExerciseStates {
  [exerciseIndex: number]: ExerciseState
}

export interface TtsActiveStates {
  [exerciseIndex: number]: boolean
}

export interface SaveLoadingStates {
  [exerciseIndex: number]: boolean
}

export interface SaveErrorStates {
  [exerciseIndex: number]: string | null
}

// Workout data to save to database
export interface WorkoutExerciseData {
  user_id: string
  workout_local_date_time: string
  workout_type: WorkoutType
  week_number: number
  exercise_name: string
  band_color: BandColor
  full_reps: number
  partial_reps: number
  notes: string
}

// Exercise history data interface (from exercise-history.ts)
export interface ExerciseHistoryData {
  exerciseName: string
  recentBand: string | null
  recentFullReps: number
  recentPartialReps: number
  recentWorkoutDate: string | null
  bestFullReps: number
  displayText: string
}

// Component props interfaces
export interface WorkoutPageState {
  user: AuthenticatedUser | null
  todaysWorkout: WorkoutInfo | null
  cadenceActive: boolean
  exercises: Exercise[]
  cadenceInterval: NodeJS.Timeout | null
  restTimer: RestTimerState | null
  restTimerInterval: NodeJS.Timeout | null
  refreshTrigger: number
  exerciseLoadingStates: ExerciseLoadingStates
  exerciseStates: ExerciseStates
  ttsActiveStates: TtsActiveStates
  saveLoadingStates: SaveLoadingStates
  saveErrorStates: SaveErrorStates
}

// Hook return types
export interface UseWorkoutDataReturn {
  user: AuthenticatedUser | null
  todaysWorkout: WorkoutInfo | null
  exercises: Exercise[]
  refreshTrigger: number
  setupExercises: (workoutType: 'Push' | 'Pull') => Promise<void>
  updateExercise: (index: number, field: string, value: string | number | boolean) => void
  saveExercise: (index: number) => Promise<void>
  retrySaveExercise: (index: number) => void
}

export interface UseExerciseStateReturn {
  exerciseStates: ExerciseStates
  exerciseLoadingStates: ExerciseLoadingStates
  ttsActiveStates: TtsActiveStates
  saveLoadingStates: SaveLoadingStates
  saveErrorStates: SaveErrorStates
  startExercise: (index: number) => Promise<void>
  setExerciseStates: React.Dispatch<React.SetStateAction<ExerciseStates>>
  setExerciseLoadingStates: React.Dispatch<React.SetStateAction<ExerciseLoadingStates>>
  setTtsActiveStates: React.Dispatch<React.SetStateAction<TtsActiveStates>>
  setSaveLoadingStates: React.Dispatch<React.SetStateAction<SaveLoadingStates>>
  setSaveErrorStates: React.Dispatch<React.SetStateAction<SaveErrorStates>>
}

export interface UseCadenceControlReturn {
  cadenceActive: boolean
  cadenceInterval: NodeJS.Timeout | null
  setCadenceActive: React.Dispatch<React.SetStateAction<boolean>>
  setCadenceInterval: React.Dispatch<React.SetStateAction<NodeJS.Timeout | null>>
}

export interface UseRestTimerReturn {
  restTimer: RestTimerState | null
  restTimerInterval: NodeJS.Timeout | null
  setRestTimer: React.Dispatch<React.SetStateAction<RestTimerState | null>>
  setRestTimerInterval: React.Dispatch<React.SetStateAction<NodeJS.Timeout | null>>
}