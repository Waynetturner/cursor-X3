
import { useState } from 'react';
import { announceToScreenReader } from '@/utils/accessibility';

interface UseExerciseInteractionProps {
  exerciseName: string;
  setters: {
    setBandColor: (value: string) => void;
    setFullReps: (value: string) => void;
    setPartialReps: (value: string) => void;
    setNotes: (value: string) => void;
  };
  onExerciseDataEntry?: () => void;
}

export const useExerciseInteraction = ({
  exerciseName,
  setters,
  onExerciseDataEntry
}: UseExerciseInteractionProps) => {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const triggerDataEntry = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      console.log(`User entered data for ${exerciseName}, triggering pace tone off`);
      if (onExerciseDataEntry) {
        onExerciseDataEntry();
      }
    }
  };

  const enhancedSetters = {
    setBandColor: (value: string) => {
      setters.setBandColor(value);
      if (value) {
        announceToScreenReader(`Band color set to ${value} for ${exerciseName}`);
        triggerDataEntry();
      }
    },
    setFullReps: (value: string) => {
      setters.setFullReps(value);
      if (value) {
        announceToScreenReader(`Full reps set to ${value} for ${exerciseName}`);
        triggerDataEntry();
      }
    },
    setPartialReps: (value: string) => {
      setters.setPartialReps(value);
      if (value) {
        announceToScreenReader(`Partial reps set to ${value} for ${exerciseName}`);
        triggerDataEntry();
      }
    },
    setNotes: (value: string) => {
      setters.setNotes(value);
      if (value) {
        triggerDataEntry();
      }
    }
  };

  return {
    enhancedSetters,
    hasUserInteracted
  };
};
