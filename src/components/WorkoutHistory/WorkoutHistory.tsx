import React, { useState, useEffect } from 'react';
import { WorkoutHistoryProps, TimeRange, TIME_RANGE_LABELS } from './types';
import { useWorkoutHistory } from './useWorkoutHistory';
import { WorkoutCard } from './WorkoutCard';
import { ChevronDown } from 'lucide-react';

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  refreshTrigger,
  maxDisplay,
  defaultRange = 'week',
  showAllControls = false,
  showTitle = true,
  compact = false
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(defaultRange);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { workouts, isLoading, error, refetch } = useWorkoutHistory(selectedRange, maxDisplay);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    setShowDropdown(false);
  };

  if (isLoading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'}`}>
        {showTitle && (
          <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold brand-gold mb-4`}>
            Recent Workouts
          </h2>
        )}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading workouts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'}`}>
        {showTitle && (
          <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold brand-gold mb-4`}>
            Recent Workouts
          </h2>
        )}
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">Error loading workouts</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button 
            onClick={refetch}
            className="btn-secondary text-sm px-4 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`brand-card ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex justify-between items-center mb-4">
        {showTitle && (
          <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold brand-gold`}>
            Recent Workouts
          </h2>
        )}
        
        {showAllControls && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {TIME_RANGE_LABELS[selectedRange]}
              <ChevronDown size={16} className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {Object.entries(TIME_RANGE_LABELS).map(([range, label]) => (
                  <button
                    key={range}
                    onClick={() => handleRangeChange(range as TimeRange)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedRange === range ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {workouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No workouts found</p>
            <p className="text-sm text-gray-400">
              {selectedRange === 'last-two' 
                ? 'Complete your first workout to see it here!'
                : `No workouts found for ${TIME_RANGE_LABELS[selectedRange].toLowerCase()}`
              }
            </p>
          </div>
        ) : (
          workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              allWorkouts={workouts}
              compact={compact}
            />
          ))
        )}
      </div>

      {/* Show More link for compact view */}
      {compact && workouts.length > 0 && (
        <div className="text-center mt-4">
          <a 
            href="/stats" 
            className="text-sm text-orange-600 hover:text-orange-700 underline font-medium"
          >
            View All Workouts →
          </a>
        </div>
      )}
    </div>
  );
};