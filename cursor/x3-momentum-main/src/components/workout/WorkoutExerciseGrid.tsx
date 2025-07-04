
import React from 'react';
import { ExerciseCard } from '@/components/ExerciseCard';

interface WorkoutExerciseGridProps {
  exercises: string[];
  workoutId: number | null;
  onExerciseSaved: () => void;
  onExerciseDataEntry?: () => void;
}

export const WorkoutExerciseGrid = ({ 
  exercises, 
  workoutId, 
  onExerciseSaved,
  onExerciseDataEntry
}: WorkoutExerciseGridProps) => {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
      role="main"
      aria-label={`Exercise grid with ${exercises.length} exercises`}
    >
      {exercises.map((exercise, index) => (
        <ExerciseCard 
          key={exercise} 
          exerciseName={exercise} 
          workoutId={workoutId}
          onExerciseSaved={onExerciseSaved}
          onExerciseDataEntry={onExerciseDataEntry}
        />
      ))}
    </div>
  );
};
