
import { Workout } from './types';

export const processWorkoutData = (workoutData: any[], exerciseData: any[]) => {
  console.log('=== PROCESSING WORKOUT DATA ===');
  console.log('Input workout data:', workoutData.length, 'workouts');
  console.log('Input exercise data:', exerciseData.length, 'exercises');
  
  // Convert workout IDs to numbers to ensure proper type matching
  const workoutIds = workoutData.map(w => Number(w.id));
  console.log('Workout IDs for matching:', workoutIds);

  // Group exercises by workout_id, ensuring proper type conversion
  const exercisesByWorkout = exerciseData.reduce((acc, exercise) => {
    const workoutId = Number(exercise.workout_id);
    console.log('Processing exercise:', exercise.exercise_name, 'for workout ID:', workoutId, 'user_id:', exercise.user_id);
    if (!acc[workoutId]) {
      acc[workoutId] = [];
    }
    acc[workoutId].push({
      exercise_name: exercise.exercise_name,
      full_reps: exercise.full_reps,
      partial_reps: exercise.partial_reps,
      band_color: exercise.band_color,
      notes: exercise.notes
    });
    return acc;
  }, {} as Record<number, any[]>);

  console.log('Exercises grouped by workout:', exercisesByWorkout);
  console.log('Workout IDs with exercises:', Object.keys(exercisesByWorkout));

  // Combine workouts with their exercises
  const workoutsWithExercises = workoutData.map(workout => {
    const workoutId = Number(workout.id);
    const exercises = exercisesByWorkout[workoutId] || [];
    console.log(`Checking workout ${workoutId}:`, {
      date: workout.date,
      type: workout.workout_type,
      exercises: exercises.length,
      user_id: workout.user_id,
      hasExercises: exercises.length > 0
    });

    return {
      ...workout,
      exercises
    };
  });

  // Filter workouts to only include those with exercises (completed workouts)
  const filteredWorkouts = workoutsWithExercises.filter(workout => {
    if (!workout.exercises || workout.exercises.length === 0) {
      console.log(`Filtering out workout ${workout.id} - no exercises`);
      return false;
    }

    console.log(`Including completed workout ${workout.id} with ${workout.exercises.length} exercises`);
    return true;
  });

  // Sort the filtered workouts by date (most recent first)
  const sortedWorkouts = filteredWorkouts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  console.log('Final filtered workouts:', sortedWorkouts.length, 'workouts');
  console.log('Workouts details:', sortedWorkouts.map(w => ({ 
    id: w.id, 
    date: w.date, 
    type: w.workout_type, 
    exercises: w.exercises?.length,
    user_id: w.user_id
  })));
  console.log('=== END PROCESSING WORKOUT DATA ===');

  return sortedWorkouts as Workout[];
};
