
import React from 'react';
import { ExerciseFormFields } from './ExerciseFormFields';
import { ExerciseSaveButton } from './ExerciseSaveButton';
import { useExerciseForm } from '@/hooks/useExerciseForm';
import { useExerciseInteraction } from '@/hooks/useExerciseInteraction';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useUISettings } from '@/hooks/useUISettings';
import { announceToScreenReader } from '@/utils/accessibility';
import { Button } from '@/components/ui/button';

interface ExerciseCardProps {
  exerciseName: string;
  workoutId: number | null;
  onExerciseSaved?: () => void;
  onExerciseDataEntry?: () => void;
}

export const ExerciseCard = ({ 
  exerciseName, 
  workoutId, 
  onExerciseSaved,
  onExerciseDataEntry 
}: ExerciseCardProps) => {
  const { speak } = useTextToSpeech();
  const { settings } = useUISettings(false);
  
  const { 
    formData, 
    setters, 
    isLoading, 
    saveExercise,
    deleteExercise,
    isSaved,
    hasUserModifiedNotes, 
    previousNotes,
    isDataLoaded
  } = useExerciseForm({ 
    exerciseName, 
    workoutId,
    onExerciseSaved
  });

  const { enhancedSetters } = useExerciseInteraction({
    exerciseName,
    setters,
    onExerciseDataEntry
  });

  const [showSavedMessage, setShowSavedMessage] = React.useState(false);

  console.log(`=== ExerciseCard ${exerciseName} RENDER ===`);
  console.log('Form data:', formData);
  console.log('Is data loaded:', isDataLoaded);
  console.log('Is saved:', isSaved);
  console.log('Previous notes:', previousNotes);
  console.log('=== END RENDER ===');

  const handleSave = async () => {
    console.log(`Saving ${exerciseName}`);
    try {
      const success = await saveExercise();
      if (success) {
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 3000);
        
        announceToScreenReader(`${exerciseName} exercise data saved successfully`, 'polite');
        
        if (settings.audio_notifications_enabled) {
          const message = `${exerciseName} saved and recorded`;
          speak(message, settings.voice_preference || 'american-male').catch(error => {
            console.warn('Failed to play save confirmation:', error);
          });
        }
      }
    } catch (error) {
      console.error(`Error saving ${exerciseName}:`, error);
      announceToScreenReader(`Error saving ${exerciseName}. Please try again.`, 'assertive');
    }
  };

  const handleDelete = async () => {
    console.log(`Deleting ${exerciseName}`);
    try {
      const success = await deleteExercise();
      if (success) {
        announceToScreenReader(`${exerciseName} exercise data deleted successfully`, 'polite');
        
        if (settings.audio_notifications_enabled) {
          const message = `${exerciseName} deleted`;
          speak(message, settings.voice_preference || 'american-male').catch(error => {
            console.warn('Failed to play delete confirmation:', error);
          });
        }
      }
    } catch (error) {
      console.error(`Error deleting ${exerciseName}:`, error);
      announceToScreenReader(`Error deleting ${exerciseName}. Please try again.`, 'assertive');
    }
  };

  const cardId = `exercise-card-${exerciseName.toLowerCase().replace(/\s+/g, '-')}`;
  const formId = `exercise-form-${exerciseName.toLowerCase().replace(/\s+/g, '-')}`;

  // Show loading state while data is being loaded
  if (!isDataLoaded) {
    return (
      <section 
        id={cardId}
        aria-labelledby={`${cardId}-heading`}
        className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
      >
        <h3 
          id={`${cardId}-heading`}
          className="text-lg font-semibold text-gray-800 mb-4"
        >
          {exerciseName}
        </h3>
        <div className="text-center text-gray-500">
          Loading previous workout data...
        </div>
      </section>
    );
  }

  return (
    <section 
      id={cardId}
      aria-labelledby={`${cardId}-heading`}
      className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
    >
      <h3 
        id={`${cardId}-heading`}
        className="text-lg font-semibold text-gray-800 mb-4"
      >
        {exerciseName}
      </h3>
      
      <form 
        id={formId}
        aria-label={`Enter workout data for ${exerciseName}`}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <ExerciseFormFields 
          formData={formData} 
          setters={enhancedSetters} 
          hasUserModifiedNotes={hasUserModifiedNotes}
          previousNotes={previousNotes}
          exerciseName={exerciseName}
        />

        {/* Show save button and delete button if saved */}
        <div className="flex gap-2 mt-3">
          <ExerciseSaveButton
            exerciseName={exerciseName}
            isLoading={isLoading}
            isSaved={isSaved}
            onSave={handleSave}
            showSavedMessage={showSavedMessage}
            cardId={cardId}
          />
          {isSaved && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isLoading}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </section>
  );
};
