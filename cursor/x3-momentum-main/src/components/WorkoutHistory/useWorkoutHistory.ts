
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { Workout, TimeRange } from './types';
import { fetchWorkouts, fetchExercises, checkAndFixDataInconsistency } from './workoutHistoryService';
import { processWorkoutData } from './workoutDataProcessor';

export const useWorkoutHistory = (currentRange: TimeRange) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInconsistency, setDataInconsistency] = useState<any>(null);
  const { user } = useAuth();

  const fetchWorkoutHistory = useCallback(async () => {
    if (!user) {
      console.log('No user found, clearing workout history');
      setWorkouts([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('=== WORKOUT HISTORY FETCH DEBUG ===');
      console.log('Fetching workout history for user:', user.id);
      console.log('User email:', user.email);
      
      setIsLoading(true);
      
      // Ensure user ID is a string
      const userId = String(user.id);

      // Fetch workouts
      const workoutData = await fetchWorkouts(userId, currentRange);
      console.log('Sample workout data:', workoutData.slice(0, 2));
      
      if (!workoutData || workoutData.length === 0) {
        console.log('No workouts found');
        setWorkouts([]);
        setError(null);
        setDataInconsistency(null);
        setIsLoading(false);
        return;
      }

      // Convert workout IDs to numbers for exercise query
      const workoutIds = workoutData.map(w => Number(w.id));
      console.log('Workout IDs found:', workoutIds);
      
      // Check for data inconsistency before proceeding
      const inconsistencyCheck = await checkAndFixDataInconsistency(userId, workoutIds);
      
      if (inconsistencyCheck.hasDataInconsistency) {
        console.log('🚨 DATA INCONSISTENCY DETECTED');
        setDataInconsistency(inconsistencyCheck);
        setWorkouts([]);
        setError('Data inconsistency detected: Workouts and exercises have mismatched IDs. Check console for details.');
        setIsLoading(false);
        return;
      }
      
      // Fetch exercises for these workouts
      const exerciseData = await fetchExercises(userId, workoutIds);

      // Process and combine the data
      const processedWorkouts = processWorkoutData(workoutData, exerciseData);
      
      console.log('=== END WORKOUT HISTORY FETCH DEBUG ===');
      
      setWorkouts(processedWorkouts);
      setError(null);
      setDataInconsistency(null);
    } catch (error) {
      console.error('Error fetching workout history:', error);
      setError('Failed to load workout history');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentRange]);

  useEffect(() => {
    fetchWorkoutHistory();
  }, [fetchWorkoutHistory]);

  return { 
    workouts, 
    isLoading, 
    error, 
    dataInconsistency,
    refetch: fetchWorkoutHistory 
  };
};
