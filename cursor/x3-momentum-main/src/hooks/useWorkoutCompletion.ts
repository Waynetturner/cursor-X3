
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PUSH_EXERCISES, PULL_EXERCISES } from '@/utils/workoutUtils';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useUISettings } from '@/hooks/useUISettings';

export const useWorkoutCompletion = (
  userId: string | undefined, 
  workoutId: number | null, 
  todaysWorkout: string
) => {
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const { speak } = useTextToSpeech();
  const { settings } = useUISettings(false);
  const isCheckingRef = useRef(false);
  const hasPlayedCompletionRef = useRef(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkWorkoutCompletion = useCallback(async () => {
    if (!userId || !workoutId || isCheckingRef.current) {
      console.log('Workout completion check: Missing userId/workoutId or already checking');
      return;
    }

    isCheckingRef.current = true;

    try {
      const exercises = todaysWorkout === 'Push' ? PUSH_EXERCISES : PULL_EXERCISES;
      console.log('Checking completion for user', userId, 'exercises:', exercises);
      
      // Use userId directly as it should already be a string
      const { data: completedExercises, error } = await supabase
        .from('exercises')
        .select('exercise_name, user_id')
        .eq('workout_id', workoutId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking workout completion:', error);
        throw error;
      }

      console.log('Found completed exercises for user', userId, ':', completedExercises);
      
      const completedNames = completedExercises?.map(ex => ex.exercise_name) || [];
      const allCompleted = exercises.every(exercise => completedNames.includes(exercise));
      
      console.log('Workout completion status for user', userId, ':', {
        requiredExercises: exercises,
        completedExercises: completedNames,
        allCompleted
      });
      
      // Check if this is a transition from incomplete to complete
      const wasJustCompleted = !workoutCompleted && allCompleted;
      
      // Update state
      setWorkoutCompleted(allCompleted);

      // Play completion message if workout was just completed and not already played
      if (wasJustCompleted && settings.audio_notifications_enabled && !hasPlayedCompletionRef.current) {
        console.log('Workout just completed for user', userId, ', scheduling completion message');
        hasPlayedCompletionRef.current = true;
        
        // Clear any existing timeout
        if (completionTimeoutRef.current) {
          clearTimeout(completionTimeoutRef.current);
        }
        
        // Add a delay to ensure all save confirmations are done
        completionTimeoutRef.current = setTimeout(() => {
          const completionMessage = "Nice work! All exercises completed. Click Finish Workout and Get Coach Analysis in the coach section below to get your personalized feedback.";
          speak(completionMessage, settings.voice_preference || 'male').catch(error => {
            console.warn('Failed to play completion message:', error);
          });
        }, 2000); // 2 second delay to ensure save confirmations are done
      }
      
    } catch (error) {
      console.error('Error checking workout completion for user', userId, ':', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [userId, workoutId, todaysWorkout, workoutCompleted, settings.audio_notifications_enabled, settings.voice_preference, speak]);

  // Reset completion flag when workout or user changes
  useEffect(() => {
    hasPlayedCompletionRef.current = false;
    setWorkoutCompleted(false); // Reset completion state when user/workout changes
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
  }, [workoutId, userId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userId && workoutId) {
      checkWorkoutCompletion();
    }
  }, [userId, workoutId, checkWorkoutCompletion]);

  const handleExerciseSaved = useCallback(() => {
    console.log('Exercise saved for user', userId, ', rechecking completion status');
    // Add a longer delay to ensure database has been updated
    setTimeout(() => {
      checkWorkoutCompletion();
    }, 1500); // Increased delay for better reliability
  }, [checkWorkoutCompletion, userId]);

  // Force recheck function for manual triggers
  const forceRecheck = useCallback(() => {
    console.log('Force rechecking workout completion for user', userId);
    hasPlayedCompletionRef.current = false; // Reset to allow playing again if needed
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
    checkWorkoutCompletion();
  }, [checkWorkoutCompletion, userId]);

  return {
    workoutCompleted,
    handleExerciseSaved,
    forceRecheck
  };
};
