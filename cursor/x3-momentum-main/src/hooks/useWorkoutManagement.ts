
import { useWorkoutState } from './useWorkoutState';
import { useWorkoutActions } from './useWorkoutActions';

export const useWorkoutManagement = (userId: string | undefined) => {
  const { 
    workoutId, 
    currentWeek, 
    todaysWorkout, 
    workoutCompleted, 
    handleExerciseSaved, 
    forceRecheck 
  } = useWorkoutState(userId);
  
  const { isAnalyzing, finishWorkout } = useWorkoutActions(
    userId,
    workoutId,
    todaysWorkout,
    currentWeek
  );

  return {
    currentWeek,
    todaysWorkout,
    workoutId,
    workoutCompleted,
    isAnalyzing,
    finishWorkout,
    handleExerciseSaved,
    forceRecheck
  };
};
