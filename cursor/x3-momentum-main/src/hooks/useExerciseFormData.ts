
import { useState } from 'react';

interface ExerciseFormData {
  bandColor: string;
  fullReps: string;
  partialReps: string;
  notes: string;
}

export const useExerciseFormData = () => {
  const [formData, setFormData] = useState<ExerciseFormData>({
    bandColor: '',
    fullReps: '',
    partialReps: '',
    notes: ''
  });

  const [hasUserModifiedNotes, setHasUserModifiedNotes] = useState(false);
  const [previousNotes, setPreviousNotes] = useState('');

  const setters = {
    setBandColor: (value: string, exerciseName?: string) => {
      if (exerciseName) {
        console.log(`Setting band color for ${exerciseName}:`, value);
      }
      setFormData(prev => ({ ...prev, bandColor: value }));
    },
    setFullReps: (value: string, exerciseName?: string) => {
      if (exerciseName) {
        console.log(`Setting full reps for ${exerciseName}:`, value);
      }
      setFormData(prev => ({ ...prev, fullReps: value }));
    },
    setPartialReps: (value: string, exerciseName?: string) => {
      if (exerciseName) {
        console.log(`Setting partial reps for ${exerciseName}:`, value);
      }
      setFormData(prev => ({ ...prev, partialReps: value }));
    },
    setNotes: (value: string, exerciseName?: string) => {
      if (exerciseName) {
        console.log(`Setting notes for ${exerciseName}:`, value);
      }
      setFormData(prev => ({ ...prev, notes: value }));
      setHasUserModifiedNotes(true);
    }
  };

  const updateFormData = (data: ExerciseFormData) => {
    setFormData(data);
  };

  const updatePreviousNotes = (notes: string) => {
    setPreviousNotes(notes);
  };

  const resetUserModifiedNotes = () => {
    setHasUserModifiedNotes(false);
  };

  return {
    formData,
    setters,
    hasUserModifiedNotes,
    previousNotes,
    updateFormData,
    updatePreviousNotes,
    resetUserModifiedNotes
  };
};
