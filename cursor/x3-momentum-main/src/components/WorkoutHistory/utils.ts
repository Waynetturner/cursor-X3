
import { TimeRange, Workout, Exercise } from './types';

export const getDateCutoff = (range: TimeRange): string | null => {
  const now = new Date();
  let cutoffDate: Date;

  switch (range) {
    case 'week':
      cutoffDate = new Date(now);
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case 'all':
      return null; // No date filter
  }

  return cutoffDate.toISOString().split('T')[0];
};

// Define exercise order for consistent display
const PUSH_EXERCISE_ORDER = ['Chest Press', 'Tricep Press', 'Overhead Press', 'Front Squat'];
const PULL_EXERCISE_ORDER = ['Deadlift', 'Bent Row', 'Bicep Curl', 'Calf Raise'];

export const sortExercisesByOrder = (exercises: Exercise[], workoutType: string): Exercise[] => {
  const orderArray = workoutType === 'Push' ? PUSH_EXERCISE_ORDER : PULL_EXERCISE_ORDER;
  
  return exercises.sort((a, b) => {
    const indexA = orderArray.indexOf(a.exercise_name);
    const indexB = orderArray.indexOf(b.exercise_name);
    
    // If exercise not found in order array, put it at the end
    const finalIndexA = indexA === -1 ? orderArray.length : indexA;
    const finalIndexB = indexB === -1 ? orderArray.length : indexB;
    
    return finalIndexA - finalIndexB;
  });
};

export const calculateWorkoutNumber = (workout: Workout, allWorkouts: Workout[]): number => {
  // Sort all workouts by date (oldest first) to maintain consistent order
  const sortedWorkouts = allWorkouts
    .filter(w => w.exercises && w.exercises.length > 0) // Only count workouts with exercises
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // For the current week, count how many of this workout type have been done in this week
  const currentWeekWorkouts = sortedWorkouts.filter(w => 
    w.week_number === workout.week_number && 
    w.workout_type === workout.workout_type &&
    new Date(w.date).getTime() <= new Date(workout.date).getTime()
  );
  
  return currentWeekWorkouts.length;
};

export const formatWorkoutDate = (dateString: string): string => {
  // Parse the date string as a local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString();
};

export const formatWorkoutTitle = (workout: Workout, workouts: Workout[]): string => {
  const workoutNumber = calculateWorkoutNumber(workout, workouts);
  return `Week ${workout.week_number}, ${workout.workout_type} ${workoutNumber}`;
};

export const getNextRange = (current: TimeRange): TimeRange | null => {
  const ranges: TimeRange[] = ['week', 'month', '3months', '6months', 'all'];
  const currentIndex = ranges.indexOf(current);
  return currentIndex < ranges.length - 1 ? ranges[currentIndex + 1] : null;
};
