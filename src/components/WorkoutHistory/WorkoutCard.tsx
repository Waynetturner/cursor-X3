import React from 'react';
import { WorkoutCardProps } from './types';

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, compact = false }) => {
  const getBandColorClasses = (bandColor: string) => {
    switch (bandColor) {
      case 'White':
        return 'bg-white text-black border border-gray-300';
      case 'Light Gray':
        return 'bg-gray-300 text-black border border-gray-400';
      case 'Dark Gray':
        return 'bg-gray-700 text-white border border-gray-600';
      case 'Black':
        return 'bg-black text-white border border-gray-800';
      case 'Elite':
        return 'bg-orange-500 text-white border border-orange-600';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200';
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
            {getWorkoutTypeEmoji(workout.workout_type)} {formatDate(workout.date)} {workout.workout_type} Workout
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex flex-wrap gap-2">
          {workout.exercises.map((exercise, exIndex) => (
            <div 
              key={exIndex} 
              className={`inline-flex items-center rounded-lg px-3 py-2 ${getBandColorClasses(exercise.band_color)}`}
            >
              <span className={compact ? 'text-xs font-medium' : 'text-sm font-medium'}>
                {exercise.exercise_name}: {exercise.full_reps}+{exercise.partial_reps}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};