
import { useState } from 'react';

export const useExerciseFormState = () => {
  const [existingExerciseId, setExistingExerciseId] = useState<number | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isPrefilledData, setIsPrefilledData] = useState(false);

  const markAsSaved = (exerciseName: string) => {
    console.log(`Marking ${exerciseName} as saved`);
    setIsSaved(true);
    setIsPrefilledData(false); // No longer pre-filled once saved
  };

  return {
    existingExerciseId,
    setExistingExerciseId,
    isDataLoaded,
    setIsDataLoaded,
    isSaved,
    setIsSaved,
    isPrefilledData,
    setIsPrefilledData,
    markAsSaved
  };
};
