
import React from 'react';
import { announceToScreenReader } from '@/utils/accessibility';

interface WorkoutCompletionStatusProps {
  workoutCompleted: boolean;
}

export const WorkoutCompletionStatus = ({
  workoutCompleted
}: WorkoutCompletionStatusProps) => {
  React.useEffect(() => {
    if (workoutCompleted) {
      announceToScreenReader(
        'Congratulations! All exercises completed. You can now get coach analysis by navigating to the coach section below.',
        'polite'
      );
    }
  }, [workoutCompleted]);

  if (!workoutCompleted) return null;

  return (
    <section 
      className="mt-6 p-4 border rounded-lg" 
      style={{ backgroundColor: '#fef3e7', borderColor: '#fed7aa' }}
      role="status"
      aria-live="polite"
      aria-label="Workout completion status"
    >
      <p 
        className="font-medium text-center" 
        style={{ color: '#f27d20' }}
        id="completion-message"
      >
        🎉 Nice work! All exercises completed. Click "Finish Workout & Get Coach Analysis" in the coach section below to get your personalized feedback.
      </p>
    </section>
  );
};
