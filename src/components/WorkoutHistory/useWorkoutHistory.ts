import { useState, useEffect, useCallback } from 'react';
import { supabase, X3_EXERCISES } from '@/lib/supabase';
import { TimeRange, Workout, UseWorkoutHistoryReturn } from './types';
import { testModeService } from '@/lib/test-mode';

export const useWorkoutHistory = (timeRange: TimeRange, maxDisplay?: number): UseWorkoutHistoryReturn => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocalDateFromStoredTime = useCallback((timestamp: string) => timestamp.split('T')[0], []);

  const fetchWorkouts = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous fetches
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if test mode is enabled
      if (testModeService.shouldMockWorkouts()) {
        console.log('🧪 Test Mode: Using mock workout data');
        const mockWorkouts = testModeService.getMockWorkouts();
        
        // Simple mock filtering - just return recent data
        const convertedWorkouts: Workout[] = mockWorkouts.map(mockWorkout => ({
          id: mockWorkout.id,
          date: mockWorkout.date,
          workout_type: mockWorkout.workout_type,
          exercises: mockWorkout.exercises.map(ex => ({
            exercise_name: ex.exercise_name,
            band_color: ex.band_color as 'Ultra Light' | 'White' | 'Light Gray' | 'Dark Gray' | 'Black' | 'Elite',
            full_reps: ex.full_reps,
            partial_reps: ex.partial_reps
          }))
        }));
        
        convertedWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
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
        throw new Error('User not authenticated');
      }

      // Calculate date filter inline to avoid dependency cycle
      let dateFilter: string | null = null;
      
      if (timeRange !== 'last-two' && timeRange !== 'all') {
        try {
          // Get user's timezone
          const { data: profile } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', user.id)
            .single();

          const userTimezone = profile?.timezone || 'UTC';
          
          // Calculate dates in user's timezone
          const now = new Date();
          const todayInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
          
          let daysBack: number;
          switch (timeRange) {
            case 'week':
              daysBack = 7;
              break;
            case 'month':
              daysBack = 30;
              break;
            case '6months':
              daysBack = 180;
              break;
            default:
              daysBack = 7;
          }

          const startDate = new Date(todayInUserTz);
          startDate.setDate(startDate.getDate() - daysBack);
          startDate.setHours(0, 0, 0, 0);
          
          dateFilter = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
          console.log(`📅 Date filter for ${timeRange}: ${dateFilter} (${daysBack} days back)`);
          
        } catch (timezoneError) {
          console.error('Error calculating date filter:', timezoneError);
          // Continue without date filtering
        }
      }
      
      // Build query
      let query = supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_local_date_time', { ascending: false });

      // Apply server-side filtering when possible
      if (dateFilter) {
        query = query.gte('workout_local_date_time', dateFilter + 'T00:00:00');
      }

      const { data: exercises, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (!exercises || exercises.length === 0) {
        console.log(`📋 No exercises found for ${timeRange}`);
        setWorkouts([]);
        return;
      }

      console.log(`📊 Found ${exercises.length} exercises for ${timeRange}`);

      // Additional client-side filtering for precision
      let filteredExercises = exercises;
      if (dateFilter) {
        filteredExercises = exercises.filter(exercise => {
          const localDate = getLocalDateFromStoredTime(exercise.workout_local_date_time);
          return localDate >= dateFilter;
        });
        console.log(`📋 After client-side filtering: ${filteredExercises.length} exercises`);
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
          band_color: exercise.band_color as 'Ultra Light' | 'White' | 'Light Gray' | 'Dark Gray' | 'Black' | 'Elite',
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

      console.log(`✅ Loaded ${workoutsArray.length} workouts for ${timeRange}`);
      setWorkouts(workoutsArray);
      
    } catch (err) {
      console.error('❌ Error fetching workout history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workout history');
      setWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, maxDisplay, getLocalDateFromStoredTime]); // Removed getDateFilter dependency

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