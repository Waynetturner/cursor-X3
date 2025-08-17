import { DataTransformer } from '@/utils';
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
      console.log('📊 Loading stats for time range:', timeRange);
      
      // FIXED: Get timezone once at the start instead of multiple calls
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single();
      
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      // Calculate today in user's timezone
      const userTimezone = profile.timezone || 'UTC';
      const today = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
      
      // SIMPLIFIED: Query workout_exercises directly instead of using getUserStats
      let query = supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('workout_local_date_time', { ascending: false });
      
      // Apply time range filter if needed
      if (timeRange !== 'alltime') {
        const { startDate } = getTimeRangeDates(timeRange);
        const startDateStr = formatDateForQuery(startDate);
        query = query.gte('workout_local_date_time', startDateStr + 'T00:00:00');
      }
      
      const { data: exercises, error: exerciseError } = await query;
      
      if (exerciseError) {
        throw new Error(`Failed to fetch exercises: ${exerciseError.message}`);
      }
      
      if (!exercises || exercises.length === 0) {
        // No exercises found - return empty stats
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
        return;
      }
      
      // Calculate stats from exercises
      const workoutDates = [...new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))];
      const totalWorkouts = workoutDates.length;
      const totalExercises = exercises.length;
      
      // Calculate average reps
      const totalReps = exercises.reduce((sum, ex) => sum + (ex.full_reps || 0) + (ex.partial_reps || 0), 0);
      const averageRepsPerExercise = totalExercises > 0 ? Math.round(totalReps / totalExercises) : 0;
      
      // Calculate most used band
      const bandCounts = exercises.reduce((acc: Record<string, number>, ex) => {
        const band = ex.band_color || 'White';
        acc[band] = (acc[band] || 0) + 1;
        return acc;
      }, {});
      const mostUsedBand = Object.entries(bandCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'White';
      
      // Calculate workouts by type
      const workoutsByType = exercises.reduce((acc: {Push: number, Pull: number}, ex) => {
        if (ex.workout_type === 'Push') acc.Push++;
        else if (ex.workout_type === 'Pull') acc.Pull++;
        return acc;
      }, { Push: 0, Pull: 0 });
      
      // Build recent workouts
      const sortedDates = workoutDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const recentWorkouts: RecentWorkout[] = sortedDates.slice(0, 5).map(date => {
        const dayExercises = exercises.filter(e => e.workout_local_date_time.startsWith(date));
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
      
      // Calculate current week (simplified)
      const { data: startProfile } = await supabase
        .from('profiles')
        .select('x3_start_date')
        .eq('id', userId)
        .single();
      
      let currentWeek = 1;
      if (startProfile?.x3_start_date) {
        const startDate = new Date(startProfile.x3_start_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        currentWeek = Math.max(1, Math.floor(daysDiff / 7) + 1);
      }
      
      // Simple streak calculation (consecutive days with workouts)
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Sort dates and calculate streaks
      const sortedWorkoutDates = workoutDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      let currentDate = new Date(today);
      
      for (let i = 0; i < 30; i++) { // Check last 30 days
        const dateStr = currentDate.toLocaleDateString('en-CA');
        if (sortedWorkoutDates.includes(dateStr)) {
          tempStreak++;
          if (i === 0 || sortedWorkoutDates.includes(new Date(currentDate.getTime() + 86400000).toLocaleDateString('en-CA'))) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          if (i === 0) currentStreak = 0; // No workout today breaks current streak
          tempStreak = 0;
        }
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      
      const finalStats: WorkoutStats = {
        totalWorkouts,
        currentWeek,
        currentStreak,
        longestStreak,
        totalExercises,
        averageRepsPerExercise,
        mostUsedBand,
        workoutsByType,
        recentWorkouts
      };
      
      setStats(finalStats);
      console.log('✅ Stats loaded successfully:', finalStats);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error loading stats:', err);
      
      setError({
        message: errorMessage,
        details: {
          stack: err instanceof Error ? err.stack : undefined,
          cause: err instanceof Error ? err.cause : err,
        }
      });
      
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