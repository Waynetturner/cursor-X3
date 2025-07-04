
import React from 'react';
import { Workout } from './types';
import { formatWorkoutDate, formatWorkoutTitle, sortExercisesByOrder } from './utils';
import { getBandColorStyle } from './bandColorUtils';

interface WorkoutCardProps {
  workout: Workout;
  allWorkouts: Workout[];
}

export const WorkoutCard = ({ workout, allWorkouts }: WorkoutCardProps) => {
  // Sort exercises by the defined order for better progression visibility
  const sortedExercises = sortExercisesByOrder(workout.exercises || [], workout.workout_type);

  return (
    <div className="border-b border-gray-200 pb-4 last:border-b-0">
      <div className="font-semibold text-blue-600 mb-1">
        {formatWorkoutDate(workout.date)}
      </div>
      <div className="text-lg text-gray-800 mb-2">
        {formatWorkoutTitle(workout, allWorkouts)}
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedExercises.map((exercise, index) => {
          const colorStyle = getBandColorStyle(exercise.band_color);
          const borderWidth = exercise.band_color.toLowerCase() === 'white' || exercise.band_color.toLowerCase() === 'black' ? 'border' : 'border-0';
          
          return (
            <span 
              key={index}
              className={`
                ${colorStyle.backgroundColor} 
                ${colorStyle.textColor} 
                ${colorStyle.borderColor} 
                ${borderWidth}
                px-2 py-1 rounded-sm text-sm font-medium
              `}
            >
              {exercise.exercise_name}: {exercise.full_reps}
              {exercise.partial_reps > 0 && `+${exercise.partial_reps}`}
            </span>
          );
        })}
      </div>
    </div>
  );
};
