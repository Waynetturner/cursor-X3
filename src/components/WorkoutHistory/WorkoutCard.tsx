import React from 'react';
import { WorkoutCardProps } from './types';

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, compact = false }) => {
  const getBandColorClasses = (bandColor: string) => {
    // Use specific colors that won't be affected by dark mode
    switch (bandColor) {
      case 'White':
        return 'band-color-exempt border' + ' ' + 'bg-white text-black border-gray-300';
      case 'Light Gray':
        return 'band-color-exempt border' + ' ' + 'bg-gray-300 text-black border-gray-400';
      case 'Dark Gray':
        return 'band-color-exempt border' + ' ' + 'bg-gray-700 text-white border-gray-600';
      case 'Black':
        return 'band-color-exempt border' + ' ' + 'bg-black text-white border-gray-800';
      case 'Elite':
        return 'band-color-exempt border' + ' ' + 'bg-orange-500 text-white border-orange-600';
      default:
        return 'band-color-exempt border' + ' ' + 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    // Parse date string directly as YYYY-MM-DD format to avoid timezone conversion
    // The dateStr is already in the correct local format (Central time)
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      return `${month}/${day}/${year}`;
    }
    
    // Fallback to original method if format is unexpected
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
    ? 'brand-card p-3 rounded-lg'
    : 'brand-card p-4 rounded-lg';

  const titleClasses = compact
    ? 'font-bold text-base mb-2 text-primary'
    : 'font-bold text-lg mb-3 text-primary';

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
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
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