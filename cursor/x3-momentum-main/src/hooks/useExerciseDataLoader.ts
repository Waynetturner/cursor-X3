
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseFormData {
  bandColor: string;
  fullReps: string;
  partialReps: string;
  notes: string;
}

interface UseExerciseDataLoaderProps {
  exerciseName: string;
  workoutId: number | null;
  updateFormData: (data: ExerciseFormData) => void;
  updatePreviousNotes: (notes: string) => void;
  setExistingExerciseId: (id: number | null) => void;
}

export const useExerciseDataLoader = ({
  exerciseName,
  workoutId,
  updateFormData,
  updatePreviousNotes,
  setExistingExerciseId
}: UseExerciseDataLoaderProps) => {
  const { user } = useAuth();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Prevent multiple loads to avoid overriding user input
      if (hasLoadedOnce) {
        console.log(`⏹️ [${exerciseName}] Data already loaded once, skipping to prevent override`);
        return;
      }

      console.log(`🔄 [${exerciseName}] Starting data load for workout ${workoutId}`);
      
      try {
        if (!user?.id || !workoutId) {
          console.log(`❌ [${exerciseName}] Missing required data - user: ${user?.id}, workoutId: ${workoutId}`);
          setIsDataLoaded(true);
          setHasLoadedOnce(true);
          return;
        }

        // Convert user.id to string to ensure consistency
        const userId = String(user.id);
        console.log(`🔍 [${exerciseName}] Using user ID: "${userId}"`);

        // Step 1: Check for existing data in current workout
        console.log(`🔍 [${exerciseName}] Checking for existing exercise data in current workout ${workoutId}`);
        const { data: currentExercise, error: currentError } = await supabase
          .from('exercises')
          .select('*')
          .eq('user_id', userId)
          .eq('workout_id', workoutId)
          .eq('exercise_name', exerciseName)
          .maybeSingle();

        if (currentError) {
          console.error(`❌ [${exerciseName}] Error fetching current exercise:`, currentError);
        }

        if (currentExercise) {
          console.log(`✅ [${exerciseName}] Found existing data in current workout:`, currentExercise);
          const loadedData = {
            bandColor: currentExercise.band_color || '',
            fullReps: currentExercise.full_reps?.toString() || '',
            partialReps: currentExercise.partial_reps?.toString() || '',
            notes: currentExercise.notes || ''
          };
          updateFormData(loadedData);
          setExistingExerciseId(currentExercise.id);
          console.log(`📝 [${exerciseName}] Loaded existing data:`, loadedData);
          setHasLoadedOnce(true);
          setIsDataLoaded(true);
          return;
        }

        // Step 2: Get the most recent exercise data for this exercise from previous workouts
        console.log(`🔍 [${exerciseName}] Looking for most recent exercise data from previous workouts`);
        
        const { data: recentExercise, error: recentError } = await supabase
          .from('exercises')
          .select('*')
          .eq('user_id', userId)
          .eq('exercise_name', exerciseName)
          .neq('workout_id', workoutId) // Exclude current workout
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentError) {
          console.error(`❌ [${exerciseName}] Error fetching recent exercise:`, recentError);
        }

        if (recentExercise) {
          console.log(`✅ [${exerciseName}] Found most recent exercise data from previous workout:`, recentExercise);
          const prefilledData = {
            bandColor: recentExercise.band_color || '',
            fullReps: recentExercise.full_reps?.toString() || '',
            partialReps: recentExercise.partial_reps?.toString() || '',
            notes: '' // Don't pre-fill notes, but save them for reference
          };
          updateFormData(prefilledData);
          updatePreviousNotes(recentExercise.notes || '');
          console.log(`📝 [${exerciseName}] Pre-filled data from most recent workout:`, prefilledData);
          console.log(`📝 [${exerciseName}] Previous notes saved for reference:`, recentExercise.notes);
        } else {
          console.log(`ℹ️ [${exerciseName}] No previous exercise data found for this exercise and user`);
        }

        setHasLoadedOnce(true);

      } catch (error) {
        console.error(`❌ [${exerciseName}] Error loading exercise data:`, error);
        setHasLoadedOnce(true);
      } finally {
        console.log(`✅ [${exerciseName}] Data loading complete, setting isDataLoaded to true`);
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, [user?.id, workoutId, exerciseName]); // Removed the function dependencies to prevent re-runs

  return {
    isDataLoaded
  };
};
