
export interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  location?: string;
  fitness_level?: string;
  x3_program?: string;
  goals?: string;
  injury_history?: string;
}

export interface WorkoutData {
  workout: { id: number };
  exercises: Array<{
    exercise_name: string;
    band_color: string;
    full_reps: number;
    partial_reps: number;
    notes?: string;
  }>;
}
