import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TimeRange, Workout, UseWorkoutHistoryReturn } from './types';

export const useWorkoutHistory = (timeRange: TimeRange, maxDisplay?: number): UseWorkoutHistoryReturn => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDateFilter = (range: TimeRange): string | null => {
    const now = new Date();
    
    switch (range) {
      case 'last-two':
        // For last-two, we'll handle this with LIMIT in the query
        return null;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo.toISOString().split('T')[0];
      case '6months':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return sixMonthsAgo.toISOString().split('T')[0];
      case 'all':
        return null;
      default:
        return null;
    }
  };

  const fetchWorkouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const dateFilter = getDateFilter(timeRange);
      
      // Build query
      let query = supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_local_date_time', { ascending: false });

      // Apply date filter if needed
      if (dateFilter && timeRange !== 'last-two') {
        query = query.gte('workout_local_date_time', dateFilter);
      }

      const { data: exercises, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (!exercises || exercises.length === 0) {
        setWorkouts([]);
        return;
      }

      // Group exercises by date and workout type
      const groupedWorkouts: Record<string, Workout> = {};
      
      exercises.forEach((exercise) => {
        const exerciseDate = exercise.workout_local_date_time.split('T')[0];
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