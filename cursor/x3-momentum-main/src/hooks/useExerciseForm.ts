
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useExerciseFormData } from './useExerciseFormData';
import { useExerciseDataLoader } from './useExerciseDataLoader';
import { useExerciseFormSave } from './useExerciseFormSave';
import { deleteExerciseByWorkoutAndName } from '@/utils/exerciseUtils';

interface UseExerciseFormProps {
  exerciseName: string;
  workoutId: number | null;
  onExerciseSaved?: () => void;
}

export const useExerciseForm = ({ exerciseName, workoutId, onExerciseSaved }: UseExerciseFormProps) => {
  const { user } = useAuth();
  const [existingExerciseId, setExistingExerciseId] = useState<number | null>(null);

  // Use the form data management hook
  const {
    formData,
    setters: baseSetters,
    hasUserModifiedNotes,
    previousNotes,
    updateFormData,
    updatePreviousNotes,
    resetUserModifiedNotes
  } = useExerciseFormData();

  // Enhance setters with exercise name for logging
  const setters = {
    setBandColor: (value: string) => baseSetters.setBandColor(value, exerciseName),
    setFullReps: (value: string) => baseSetters.setFullReps(value, exerciseName),
    setPartialReps: (value: string) => baseSetters.setPartialReps(value, exerciseName),
    setNotes: (value: string) => baseSetters.setNotes(value, exerciseName)
  };

  // Use the data loader hook
  const { isDataLoaded } = useExerciseDataLoader({
    exerciseName,
    workoutId,
    updateFormData,
    updatePreviousNotes,
    setExistingExerciseId
  });

  // Use the save functionality hook
  const { saveExercise, isLoading } = useExerciseFormSave({
    userId: user?.id,
    workoutId,
    exerciseName,
    formData,
    existingExerciseId,
    setExistingExerciseId,
    onExerciseSaved
  });

  const deleteExercise = async (): Promise<boolean> => {
    if (!user?.id || !workoutId) {
      console.error('Cannot delete: missing user ID or workout ID');
      return false;
    }

    console.log(`🗑️ Deleting ${exerciseName}`);
    const success = await deleteExerciseByWorkoutAndName(user.id, workoutId, exerciseName);
    
    if (success) {
      // Reset the form state
      setExistingExerciseId(null);
      resetUserModifiedNotes();
      onExerciseSaved?.();
      console.log(`✅ Successfully deleted and reset ${exerciseName}`);
    }
    
    return success;
  };

  const isSaved = Boolean(existingExerciseId);

  console.log(`=== useExerciseForm ${exerciseName} STATE ===`);
  console.log('Form data:', formData);
  console.log('Is data loaded:', isDataLoaded);
  console.log('Is saved:', isSaved);
  console.log('Previous notes:', previousNotes);
  console.log('=== END STATE ===');

  return {
    formData,
    setters,
    saveExercise,
    deleteExercise,
    isLoading,
    isSaved,
    hasUserModifiedNotes,
    previousNotes,
    isDataLoaded
  };
};
