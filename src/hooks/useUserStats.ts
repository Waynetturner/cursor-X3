import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserStats } from '@/lib/user-stats';
import { WorkoutStats, TimeRange, UseUserStatsResult, StatsError, RecentWorkout } from '@/types/stats';
import { getTimeRangeDates, formatDateForQuery } from '@/utils/time-range';

export function useUserStats(userId: string | null, timeRange: TimeRange): UseUserStatsResult {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StatsError | null>(null);

  const loadStats = useCallback(async (): Promise<void> => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 Loading stats using unified service for time range:', timeRange);
      
      // Get unified stats from single source of truth
      const userStats = await getUserStats(userId);
      
      if (!userStats) {
        throw new Error('Failed to get user stats');
      }
      
      // For time-range filtered data, we need to query exercises
      let filteredTotalWorkouts = userStats.totalWorkouts;
      let filteredTotalExercises = userStats.totalExercises;
      let recentWorkouts: RecentWorkout[] = [];
      
      // Apply time range filter for specific stats
      if (timeRange !== 'alltime') {
        const { startDate } = getTimeRangeDates(timeRange);
        const startDateStr = formatDateForQuery(startDate);
        
        // Get filtered exercises
        const { data: filteredExercises, error: exerciseError } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('user_id', userId)
          .gte('workout_local_date_time', startDateStr + 'T00:00:00')
          .order('workout_local_date_time', { ascending: false });
        
        if (exerciseError) {
          throw new Error(`Failed to fetch filtered exercises: ${exerciseError.message}`);
        }
        
        if (filteredExercises) {
          const filteredWorkoutDates = [...new Set(filteredExercises.map(e => e.workout_local_date_time.split('T')[0]))];
          filteredTotalWorkouts = filteredWorkoutDates.length;
          filteredTotalExercises = filteredExercises.length;
          
          // Build recent workouts from filtered data
          const sortedDates = filteredWorkoutDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          recentWorkouts = sortedDates.slice(0, 5).map(date => {
            const dayExercises = filteredExercises.filter(e => e.workout_local_date_time.startsWith(date));
            return {
              date,
              type: dayExercises[0]?.workout_type || 'Mixed',
              exercises: [...new Set(dayExercises.map(e => e.exercise_name))].length,
              exerciseDetails: dayExercises.map(ex => ({
                name: ex.exercise_name,
                fullReps: ex.full_reps || 0,
                partialReps: ex.partial_reps || 0,
                bandColor: ex.band_color || 'White'
              }))
            };
          });
        }
      } else {
        // For 'alltime', build recent workouts from all data
        const { data: allExercises, error: allExerciseError } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('user_id', userId)
          .order('workout_local_date_time', { ascending: false })
          .limit(50); // Limit for performance
        
        if (allExerciseError) {
          throw new Error(`Failed to fetch all exercises: ${allExerciseError.message}`);
        }
        
        if (allExercises) {
          const allWorkoutDates = [...new Set(allExercises.map(e => e.workout_local_date_time.split('T')[0]))];
          const sortedDates = allWorkoutDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          recentWorkouts = sortedDates.slice(0, 5).map(date => {
            const dayExercises = allExercises.filter(e => e.workout_local_date_time.startsWith(date));
            return {
              date,
              type: dayExercises[0]?.workout_type || 'Mixed',
              exercises: [...new Set(dayExercises.map(e => e.exercise_name))].length,
              exerciseDetails: dayExercises.map(ex => ({
                name: ex.exercise_name,
                fullReps: ex.full_reps || 0,
                partialReps: ex.partial_reps || 0,
                bandColor: ex.band_color || 'White'
              }))
            };
          });
        }
      }
      
      // Use unified stats with time-range adjustments
      const finalStats: WorkoutStats = {
        totalWorkouts: filteredTotalWorkouts,
        currentWeek: userStats.currentWeek,
        currentStreak: userStats.currentStreak, // Always from unified source
        longestStreak: userStats.longestStreak, // Always from unified source
        totalExercises: filteredTotalExercises,
        averageRepsPerExercise: userStats.averageRepsPerExercise,
        mostUsedBand: userStats.mostUsedBand,
        workoutsByType: userStats.workoutsByType,
        recentWorkouts
      };
      
      setStats(finalStats);
      
      console.log('✅ Stats loaded with unified service:', {
        currentStreak: userStats.currentStreak,
        longestStreak: userStats.longestStreak,
        currentWeek: userStats.currentWeek,
        totalWorkouts: filteredTotalWorkouts
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error loading stats with unified service:', err);
      
      setError({
        message: errorMessage,
        details: {
          stack: err instanceof Error ? err.stack : undefined,
          cause: err instanceof Error ? err.cause : err,
        }
      });
      
      // Set default stats on error to prevent UI breaking
      setStats({
        totalWorkouts: 0,
        currentWeek: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalExercises: 0,
        averageRepsPerExercise: 0,
        mostUsedBand: 'White',
        workoutsByType: { Push: 0, Pull: 0 },
        recentWorkouts: []
      });
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  const refetch = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch
  };
}