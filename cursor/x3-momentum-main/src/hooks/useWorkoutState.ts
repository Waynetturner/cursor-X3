
import { useWorkoutCreation } from './useWorkoutCreation';
import { useWorkoutCompletion } from './useWorkoutCompletion';

export const useWorkoutState = (userId: string | undefined) => {
  const { workoutId, currentWeek, todaysWorkout } = useWorkoutCreation(userId);
  
  const { workoutCompleted, handleExerciseSaved, forceRecheck } = useWorkoutCompletion(
    userId, 
    workoutId, 
    todaysWorkout
  );

  return {
    workoutId,
    currentWeek,
    todaysWorkout,
    workoutCompleted,
    handleExerciseSaved,
    forceRecheck
  };
};
