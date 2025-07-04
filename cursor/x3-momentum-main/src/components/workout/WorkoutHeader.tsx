
import React from 'react';
import { PaceTone } from './PaceTone';

interface WorkoutHeaderProps {
  todaysWorkout: string;
  paceToneActive: boolean;
  onPaceToneToggle: () => void;
}

export const WorkoutHeader = ({ 
  todaysWorkout, 
  paceToneActive, 
  onPaceToneToggle 
}: WorkoutHeaderProps) => {
  return (
    <header className="flex justify-between items-center mb-6">
      <h2 
        id="workout-title"
        className="text-2xl font-bold text-gray-800"
      >
        Today's {todaysWorkout} Workout
      </h2>
      <div role="toolbar" aria-label="Workout controls">
        <PaceTone 
          isActive={paceToneActive}
          onToggle={onPaceToneToggle}
        />
      </div>
    </header>
  );
};
