
import React from 'react';
import { Button } from '@/components/ui/button';

interface ExerciseSaveButtonProps {
  exerciseName: string;
  isLoading: boolean;
  isSaved: boolean;
  onSave: () => void;
  showSavedMessage: boolean;
  cardId: string;
}

export const ExerciseSaveButton = ({
  exerciseName,
  isLoading,
  isSaved,
  onSave,
  showSavedMessage,
  cardId
}: ExerciseSaveButtonProps) => {
  const getButtonContent = () => {
    if (isLoading) {
      return 'Saving...';
    }
    if (showSavedMessage) {
      return `${exerciseName} Saved`;
    }
    if (isSaved) {
      return `Update ${exerciseName}`;
    }
    return `Save ${exerciseName}`;
  };

  const getButtonStyles = () => {
    if (showSavedMessage) {
      return "flex-1 !bg-white !text-[#f27d20] !border !border-[#f27d20] hover:!bg-orange-50 !transition-colors !duration-300";
    }
    return "flex-1 !bg-[#f27d20] !text-white hover:!bg-[#e56b10] !transition-colors !duration-300";
  };

  return (
    <>
      <Button 
        type="submit"
        onClick={onSave}
        disabled={isLoading}
        className={getButtonStyles()}
        aria-describedby={showSavedMessage ? `${cardId}-status` : undefined}
      >
        {getButtonContent()}
      </Button>
      
      {showSavedMessage && (
        <div 
          id={`${cardId}-status`}
          aria-live="polite"
          className="sr-only"
        >
          {exerciseName} exercise data has been saved successfully
        </div>
      )}
    </>
  );
};
