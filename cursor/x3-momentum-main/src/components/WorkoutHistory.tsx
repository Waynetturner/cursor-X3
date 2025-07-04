import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { TimeRange, TIME_RANGE_LABELS } from './WorkoutHistory/types';
import { getNextRange } from './WorkoutHistory/utils';
import { WorkoutCard } from './WorkoutHistory/WorkoutCard';
import { useWorkoutHistory } from './WorkoutHistory/useWorkoutHistory';
import { useUISettings } from '@/hooks/useUISettings';
import { createTestExercisesForWorkout } from './WorkoutHistory/workoutHistoryService';
import { useAuth } from './AuthProvider';

interface WorkoutHistoryProps {
  refreshTrigger?: number;
}

export const WorkoutHistory = ({ refreshTrigger }: WorkoutHistoryProps) => {
  const { settings } = useUISettings(false);
  const { user } = useAuth();
  const [currentRange, setCurrentRange] = useState<TimeRange>('week');
  const [hasExpandedFromLastTwo, setHasExpandedFromLastTwo] = useState(false);
  const { workouts, isLoading, error, dataInconsistency, refetch } = useWorkoutHistory(currentRange);

  // Update initial range based on user settings
  useEffect(() => {
    if (settings.workout_history_default) {
      const settingsToRangeMap = {
        'last-two': 'week',
        'week': 'week',
        'month': 'month', 
        'six-months': '6months',
        'all': 'all'
      };
      setCurrentRange(settingsToRangeMap[settings.workout_history_default] as TimeRange);
      setHasExpandedFromLastTwo(false);
    }
  }, [settings.workout_history_default]);

  // Refresh workout history when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('WorkoutHistory: Refreshing due to trigger:', refreshTrigger);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleShowMoreHistory = () => {
    if (settings.workout_history_default === 'last-two' && !hasExpandedFromLastTwo) {
      setHasExpandedFromLastTwo(true);
      return;
    }

    const nextRange = getNextRange(currentRange);
    if (nextRange) {
      setCurrentRange(nextRange);
      setHasExpandedFromLastTwo(true);
    }
  };

  const handleCreateTestExercises = async () => {
    if (!user || !dataInconsistency) return;
    
    const userId = String(user.id);
    console.log('Creating test exercises for first workout...');
    
    // Create test exercises for the first workout
    const firstWorkoutId = dataInconsistency.workoutIds[0];
    const result = await createTestExercisesForWorkout(userId, firstWorkoutId, 'Push');
    
    if (result.success) {
      console.log('Test exercises created successfully, refreshing data...');
      refetch();
    } else {
      console.error('Failed to create test exercises:', result.error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Workouts</h2>
        <div className="text-center text-gray-500">Loading workout history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Workouts</h2>
        <div className="text-center text-red-500 py-8">
          Error loading workout history: {error}
        </div>
        
        {dataInconsistency && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Data Inconsistency Detected</h3>
            <p className="text-yellow-700 text-sm mb-3">
              Your workout records and exercise data have mismatched IDs. This can happen when data is recreated.
            </p>
            <div className="text-xs text-yellow-600 mb-3">
              <p>Workout IDs: {dataInconsistency.workoutIds.join(', ')}</p>
              <p>Exercise workout_ids: {dataInconsistency.userExerciseWorkoutIds.join(', ')}</p>
            </div>
            <Button 
              onClick={handleCreateTestExercises}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Create Test Exercises to Fix
            </Button>
          </div>
        )}
      </div>
    );
  }

  const nextRange = getNextRange(currentRange);
  
  // Determine what workouts to display
  const shouldShowOnlyLastTwo = settings.workout_history_default === 'last-two' && !hasExpandedFromLastTwo;
  const displayWorkouts = shouldShowOnlyLastTwo ? workouts.slice(0, 2) : workouts;

  const getButtonText = () => {
    if (settings.workout_history_default === 'last-two' && !hasExpandedFromLastTwo) {
      return `Show More History (${TIME_RANGE_LABELS[currentRange]})`;
    }
    if (nextRange) {
      return `Show More History (${TIME_RANGE_LABELS[nextRange]})`;
    }
    return 'Show More History';
  };

  const shouldShowButton = (nextRange || (settings.workout_history_default === 'last-two' && !hasExpandedFromLastTwo)) && workouts.length > 0;

  const getDisplayLabel = () => {
    if (shouldShowOnlyLastTwo) {
      return 'Last 2 Workouts';
    }
    return TIME_RANGE_LABELS[currentRange];
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Recent Workouts</h2>
        <span className="text-sm text-gray-500">
          Showing: {getDisplayLabel()}
        </span>
      </div>
      
      {displayWorkouts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {shouldShowOnlyLastTwo || currentRange === 'week'
            ? "No workouts in the past week. Complete your first workout to see history!" 
            : `No workouts found in the ${TIME_RANGE_LABELS[currentRange].toLowerCase()}.`
          }
        </div>
      ) : (
        <div className="space-y-4">
          {displayWorkouts.map((workout) => (
            <WorkoutCard 
              key={workout.id} 
              workout={workout} 
              allWorkouts={workouts}
            />
          ))}
        </div>
      )}

      {shouldShowButton && (
        <div className="mt-6 text-center">
          <Button 
            onClick={handleShowMoreHistory}
            variant="outline"
            className="text-blue-600 hover:text-blue-700"
          >
            {getButtonText()}
          </Button>
        </div>
      )}
    </div>
  );
};
