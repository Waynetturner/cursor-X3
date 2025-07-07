import React from 'react';
import { WorkoutCardProps } from './types';

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, compact = false }) => {
  const getBandColorClasses = (bandColor: string) => {
    switch (bandColor) {
      case 'White':
        return 'bg-white text-black border-2 border-black';
      case 'Light Gray':
        return 'bg-gray-300 text-black border-2 border-gray-600';
      case 'Dark Gray':
        return 'bg-gray-700 text-white border-2 border-gray-700';
      case 'Black':
        return 'bg-black text-white border-2 border-black';
      default:
        return 'bg-gray-50 text-gray-800 border-2 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getWorkoutTypeEmoji = (type: string) => {
    return type === 'Push' ? '💪' : '🔄';
  };

  const cardClasses = compact 
    ? 'bg-gray-50 p-3 rounded-lg border border-gray-200'
    : 'bg-gray-50 p-4 rounded-lg border border-gray-200';

  const titleClasses = compact
    ? 'font-bold text-base mb-2'
    : 'font-bold text-lg mb-3';

  const exerciseSpacing = compact ? 'space-y-1' : 'space-y-2';

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className={titleClasses}>
            {getWorkoutTypeEmoji(workout.workout_type)} {formatDate(workout.date)} {workout.workout_type} Workout - {workout.exercises.length} exercises
          </p>
        </div>
      </div>
      
      <div className={exerciseSpacing}>
        <p className={`text-sm font-medium text-gray-700 ${compact ? 'mb-1' : 'mb-2'}`}>
          Exercises:
        </p>
        <div className={exerciseSpacing}>
          {workout.exercises.map((exercise, exIndex) => (
            <div key={exIndex} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={compact ? 'text-xs' : 'text-sm'}>
                  - {exercise.exercise_name}: {exercise.full_reps}+{exercise.partial_reps}
                </span>
                <span 
                  className={`text-xs px-2 py-1 rounded font-semibold ${getBandColorClasses(exercise.band_color)}`}
                >
                  {exercise.band_color} band
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};