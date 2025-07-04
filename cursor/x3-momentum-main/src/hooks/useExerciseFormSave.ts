
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseFormData {
  bandColor: string;
  fullReps: string;
  partialReps: string;
  notes: string;
}

interface UseExerciseFormSaveProps {
  userId: string | undefined;
  workoutId: number | null;
  exerciseName: string;
  formData: ExerciseFormData;
  existingExerciseId: number | null;
  setExistingExerciseId: (id: number | null) => void;
  onExerciseSaved?: () => void;
}

export const useExerciseFormSave = ({
  userId,
  workoutId,
  exerciseName,
  formData,
  existingExerciseId,
  setExistingExerciseId,
  onExerciseSaved
}: UseExerciseFormSaveProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const saveExercise = async () => {
    if (!userId || !workoutId) {
      console.error('Cannot save: missing user ID or workout ID');
      return false;
    }

    // Ensure userId is converted to string for consistency
    const userIdString = String(userId);
    console.log(`💾 Saving ${exerciseName} with data:`, formData);
    console.log(`💾 Using user ID: "${userIdString}" (type: ${typeof userIdString})`);
    console.log(`💾 Using workout ID: ${workoutId} (type: ${typeof workoutId})`);
    
    setIsLoading(true);
    
    try {
      const exerciseData = {
        user_id: userIdString,
        workout_id: workoutId,
        exercise_name: exerciseName,
        band_color: formData.bandColor || null,
        full_reps: formData.fullReps ? parseInt(formData.fullReps) : null,
        partial_reps: formData.partialReps ? parseInt(formData.partialReps) : null,
        notes: formData.notes || null
      };

      console.log(`💾 Prepared exercise data:`, exerciseData);

      if (existingExerciseId) {
        console.log(`🔄 Updating existing exercise ${existingExerciseId}`);
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', existingExerciseId);

        if (error) {
          console.error('Error updating exercise:', error);
          throw error;
        }
      } else {
        console.log(`➕ Inserting new exercise`);
        const { data, error } = await supabase
          .from('exercises')
          .insert(exerciseData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting exercise:', error);
          throw error;
        }
        
        console.log(`✅ Insert successful, returned data:`, data);
        setExistingExerciseId(data.id);
        console.log(`✅ Created new exercise with ID: ${data.id}`);
      }

      console.log(`✅ Successfully saved ${exerciseName}`);
      onExerciseSaved?.();
      return true;
    } catch (error) {
      console.error('Error saving exercise:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveExercise,
    isLoading
  };
};
