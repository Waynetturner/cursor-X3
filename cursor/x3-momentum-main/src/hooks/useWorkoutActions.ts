
import { useWorkoutFinishing } from './useWorkoutFinishing';

export const useWorkoutActions = (
  userId: string | undefined,
  workoutId: number | null,
  todaysWorkout: string,
  currentWeek: number
) => {
  const { isAnalyzing, finishWorkout } = useWorkoutFinishing(
    userId,
    workoutId,
    todaysWorkout,
    currentWeek
  );

  return {
    isAnalyzing,
    finishWorkout
  };
};
