
import React from 'react';
import { useAuth } from './AuthProvider';
import { useWorkoutCreation } from '@/hooks/useWorkoutCreation';
import { usePaceTone } from '@/hooks/usePaceTone';
import { WorkoutHeader } from './workout/WorkoutHeader';
import { RestDay } from './workout/RestDay';
import { WorkoutExerciseGrid } from './workout/WorkoutExerciseGrid';
import { WorkoutCompletionStatus } from './workout/WorkoutCompletionStatus';
import { useWorkoutCompletion } from '@/hooks/useWorkoutCompletion';
import { PUSH_EXERCISES, PULL_EXERCISES } from '@/utils/workoutUtils';

interface WorkoutSectionProps {
  onWorkoutUpdated?: () => void;
}

export const WorkoutSection = ({ onWorkoutUpdated }: WorkoutSectionProps) => {
  const { user } = useAuth();
  const { workoutId, todaysWorkout, isLoading } = useWorkoutCreation(user?.id);
  const { workoutCompleted, handleExerciseSaved } = useWorkoutCompletion(
    user?.id, 
    workoutId, 
    todaysWorkout
  );
  
  const { isActive: paceToneActive, toggle: togglePaceTone, turnOff: turnOffPaceTone } = usePaceTone();

  console.log('=== WORKOUT SECTION RENDER ===');
  console.log('User ID:', user?.id);
  console.log('Workout ID:', workoutId);
  console.log('Today\'s workout:', todaysWorkout);
  console.log('Is loading:', isLoading);
  console.log('=== END WORKOUT SECTION RENDER ===');

  if (!user) {
    console.log('No user found, returning null');
    return null;
  }

  // Show loading state while workout is being created
  if (isLoading) {
    console.log('Showing loading state');
    return (
      <section className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <p className="text-gray-600">Loading workout...</p>
          <div className="mt-2 text-sm text-gray-500">
             Creating workout for {todaysWorkout} on {new Date().toISOString().split('T')[0]}
          </div>
        </div>
      </section>
    );
  }

  // Show rest day
  if (todaysWorkout === 'Rest') {
    console.log('Showing rest day');
    return (
      <section aria-label="Rest Day">
        <RestDay />
      </section>
    );
  }

  // Show error state if workout creation failed
  if (!workoutId) {
    console.log('No workout ID, showing error state');
    return (
      <section className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's {todaysWorkout} Workout</h2>
          <p className="text-red-600 mb-4">Unable to create workout. Please try refreshing the page.</p>
          <div className="text-sm text-gray-500 mb-4">
            Debug info: User: {user?.id}, Workout: {todaysWorkout}, Date: {new Date().toISOString().split('T')[0]}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </section>
    );
  }

  const exercises = todaysWorkout === 'Push' ? PUSH_EXERCISES : PULL_EXERCISES;

  const onExerciseSaved = () => {
    handleExerciseSaved();
    if (onWorkoutUpdated) {
      onWorkoutUpdated();
    }
  };

  const onExerciseDataEntry = () => {
    console.log('Exercise data entry detected, turning off pace tone');
    turnOffPaceTone();
  };

  console.log('Rendering workout section with ID:', workoutId);

  return (
    <section 
      className="bg-white p-8 rounded-2xl shadow-lg"
      aria-labelledby="workout-title"
    >
      <WorkoutHeader 
        todaysWorkout={todaysWorkout}
        paceToneActive={paceToneActive}
        onPaceToneToggle={togglePaceTone}
      />
      
      <WorkoutExerciseGrid
        exercises={exercises}
        workoutId={workoutId}
        onExerciseSaved={onExerciseSaved}
        onExerciseDataEntry={onExerciseDataEntry}
      />

      <WorkoutCompletionStatus workoutCompleted={workoutCompleted} />
    </section>
  );
};
