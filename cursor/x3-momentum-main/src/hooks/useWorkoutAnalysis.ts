
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekAndDay } from '@/utils/workoutUtils';
import { WorkoutData } from '@/types/coach';

export const useWorkoutAnalysis = (userId: string | undefined) => {
  const [hasAnalyzedWorkout, setHasAnalyzedWorkout] = useState(false);

  useEffect(() => {
    if (userId) {
      checkWorkoutAnalysisStatus();
    }
  }, [userId]);

  const checkWorkoutAnalysisStatus = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Convert userId to string to match the coach_conversations.user_id column type
      const userIdString = String(userId);
      
      // Check if there are any coach responses today that mention workout analysis
      const { data, error } = await supabase
        .from('coach_conversations')
        .select('coach_response')
        .eq('user_id', userIdString)
        .gte('created_at', today)
        .like('coach_response', '%finished%');

      if (error) {
        console.error('Error checking workout analysis status:', error);
        return;
      }

      setHasAnalyzedWorkout(data && data.length > 0);
    } catch (error) {
      console.error('Error checking workout analysis status:', error);
    }
  };

  const getTodaysWorkoutData = async (): Promise<WorkoutData | null> => {
    if (!userId) {
      console.log('No userId provided for workout data retrieval');
      return null;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { todaysWorkout } = getWeekAndDay();
      
      // Convert userId to string to match database column types
      const userIdString = String(userId);
      
      console.log('=== WORKOUT DATA RETRIEVAL DEBUG ===');
      console.log('Today:', today);
      console.log('Expected workout type:', todaysWorkout);
      console.log('User ID:', userIdString);
      
      // First, check if today is a rest day
      if (todaysWorkout === 'Rest') {
        console.log('Today is a rest day, no workout data expected');
        return null;
      }
      
      // Get today's workout with exercises in a single query using JOIN
      const { data: workoutsWithExercises, error: workoutError } = await supabase
        .from('workouts')
        .select(`
          id,
          workout_type,
          date,
          week_number,
          exercises (
            exercise_name,
            full_reps,
            partial_reps,
            band_color,
            notes
          )
        `)
        .eq('date', today)
        .eq('user_id', userIdString)
        .order('created_at', { ascending: false });

      if (workoutError) {
        console.error('Error loading workouts with exercises:', workoutError);
        return null;
      }

      console.log('Found workouts with exercises for today:', workoutsWithExercises);

      if (!workoutsWithExercises || workoutsWithExercises.length === 0) {
        console.log('No workouts found for today');
        return null;
      }

      // Find a workout that has exercises
      let workoutWithExercises = null;
      for (const workout of workoutsWithExercises) {
        if (workout.exercises && workout.exercises.length > 0) {
          workoutWithExercises = workout;
          break;
        }
      }

      if (!workoutWithExercises) {
        console.log('No workouts with exercises found for today');
        return null;
      }

      console.log('=== RETURNING WORKOUT DATA ===');
      console.log('Workout ID:', workoutWithExercises.id);
      console.log('Exercise count:', workoutWithExercises.exercises.length);
      console.log('Exercises:', workoutWithExercises.exercises.map(ex => `${ex.exercise_name}: ${ex.full_reps} reps with ${ex.band_color} band`));

      return { 
        workout: {
          id: workoutWithExercises.id
        }, 
        exercises: workoutWithExercises.exercises 
      };
    } catch (error) {
      console.error('Error loading workout data:', error);
      return null;
    }
  };

  return {
    hasAnalyzedWorkout,
    setHasAnalyzedWorkout,
    getTodaysWorkoutData,
    checkWorkoutAnalysisStatus
  };
};
