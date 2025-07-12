import { useState, useEffect, useCallback } from 'react';
import { supabase, X3_EXERCISES } from '@/lib/supabase';
import { TimeRange, Workout, UseWorkoutHistoryReturn } from './types';
import { timezoneUtils } from '@/lib/timezone';
import { testModeService } from '@/lib/test-mode';

export const useWorkoutHistory = (timeRange: TimeRange, maxDisplay?: number): UseWorkoutHistoryReturn => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the timezone utility for proper Central time handling
  const getLocalDateFromStoredTime = timezoneUtils.getLocalDateFromTimestamp;

  const getDateFilter = (range: TimeRange): string | null => {
    switch (range) {
      case 'last-two':
        // For last-two, we'll handle this with LIMIT in the query
        return null;
      case 'week':
      case 'month':
      case '6months':
        const dateRange = timezoneUtils.getDateRange(range);
        console.log(`📅 Date filter for ${range}:`, dateRange);
        return dateRange.start;
      case 'all':
        return null;
      default:
        return null;
    }
  };

  const fetchWorkouts = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous fetches
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if test mode is enabled
      if (testModeService.shouldMockWorkouts()) {
        console.log('🧪 Test Mode: Using mock workout data');
        const mockWorkouts = testModeService.getMockWorkouts();
        
        // Filter mock workouts by date range
        const dateFilter = getDateFilter(timeRange);
        let filteredMockWorkouts = mockWorkouts;
        
        if (dateFilter && timeRange !== 'last-two') {
          filteredMockWorkouts = mockWorkouts.filter(workout => 
            workout.date >= dateFilter
          );
        }
        
        // Convert mock data to Workout format
        const convertedWorkouts: Workout[] = filteredMockWorkouts.map(mockWorkout => ({
          id: mockWorkout.id,
          date: mockWorkout.date,
          workout_type: mockWorkout.workout_type,
          exercises: mockWorkout.exercises
        }));
        
        // Sort by date (newest first)
        convertedWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Apply maxDisplay limit
        let finalWorkouts = convertedWorkouts;
        if (timeRange === 'last-two') {
          finalWorkouts = convertedWorkouts.slice(0, 2);
        } else if (maxDisplay) {
          finalWorkouts = convertedWorkouts.slice(0, maxDisplay);
        }
        
        setWorkouts(finalWorkouts);
        setIsLoading(false);
        return;
      }

      // Get current user for real data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setIsLoading(false);
        throw new Error('User not authenticated');
      }

      const dateFilter = getDateFilter(timeRange);
      
      // Build query - fetch all exercises and filter client-side for accurate timezone handling
      const { data: exercises, error: fetchError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_local_date_time', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!exercises || exercises.length === 0) {
        setWorkouts([]);
        return;
      }

      // Filter exercises by date range using local date conversion
      let filteredExercises = exercises;
      if (dateFilter && timeRange !== 'last-two') {
        filteredExercises = exercises.filter(exercise => {
          const localDate = getLocalDateFromStoredTime(exercise.workout_local_date_time);
          return localDate >= dateFilter;
        });
      }

      // Group exercises by date and workout type
      const groupedWorkouts: Record<string, Workout> = {};
      
      filteredExercises.forEach((exercise) => {
        const exerciseDate = getLocalDateFromStoredTime(exercise.workout_local_date_time);
        const key = `${exerciseDate}_${exercise.workout_type}`;
        
        if (!groupedWorkouts[key]) {
          groupedWorkouts[key] = {
            id: key,
            date: exerciseDate,
            workout_type: exercise.workout_type,
            exercises: []
          };
        }
        
        groupedWorkouts[key].exercises.push({
          exercise_name: exercise.exercise_name,
          band_color: exercise.band_color,
          full_reps: exercise.full_reps || 0,
          partial_reps: exercise.partial_reps || 0
        });
      });

      // Sort exercises within each workout according to X3_EXERCISES order
      Object.values(groupedWorkouts).forEach(workout => {
        const exerciseOrder = X3_EXERCISES[workout.workout_type as 'Push' | 'Pull'] || [];
        workout.exercises.sort((a, b) => {
          const indexA = exerciseOrder.indexOf(a.exercise_name);
          const indexB = exerciseOrder.indexOf(b.exercise_name);
          // If exercise not found in order, put it at the end
          const orderA = indexA === -1 ? 999 : indexA;
          const orderB = indexB === -1 ? 999 : indexB;
          return orderA - orderB;
        });
      });

      // Convert to array and sort by date (newest first)
      let workoutsArray = Object.values(groupedWorkouts).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Handle last-two and maxDisplay
      if (timeRange === 'last-two') {
        workoutsArray = workoutsArray.slice(0, 2);
      } else if (maxDisplay) {
        workoutsArray = workoutsArray.slice(0, maxDisplay);
      }

      setWorkouts(workoutsArray);
      
    } catch (err) {
      console.error('Error fetching workout history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workout history');
      setWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, maxDisplay]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const refetch = () => {
    fetchWorkouts();
  };

  return {
    workouts,
    isLoading,
    error,
    refetch
  };
};