
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekAndDay, getTodaysWorkout } from '@/utils/workoutUtils';
import { useAuth } from './AuthProvider';

export const DashboardStats = () => {
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { currentWeek, todaysWorkout } = getWeekAndDay();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTotalWorkouts();
    }
  }, [user]);

  const fetchTotalWorkouts = async () => {
    if (!user) return;

    try {
      console.log('=== DASHBOARD STATS DEBUG ===');
      console.log('Fetching completed workouts count for user:', user.id);
      console.log('User email:', user.email);
      
      const userId = user.id;
      console.log('Using user ID:', userId);
      
      // First get all workouts for the user
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('id, date, workout_type, user_id')
        .eq('user_id', userId);
      
      if (workoutError) {
        console.error('Error fetching workouts:', workoutError);
        setError(workoutError.message);
        return;
      }
      
      console.log('Raw workouts data for current user:', workoutData);
      console.log('Number of workouts found:', workoutData?.length || 0);
      
      if (!workoutData || workoutData.length === 0) {
        console.log('No workouts found for user');
        setTotalWorkouts(0);
        setError(null);
        return;
      }

      // Now check which workouts have exercises
      const workoutIds = workoutData.map(w => w.id);
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('workout_id')
        .in('workout_id', workoutIds)
        .eq('user_id', userId);

      if (exerciseError) {
        console.error('Error fetching exercises:', exerciseError);
        setError(exerciseError.message);
        return;
      }

      // Get unique workout IDs that have exercises  
      const workoutIdsWithExercises = [...new Set(exerciseData?.map(e => e.workout_id) || [])];
      
      // Count only workouts that have exercises (completed workouts)
      const completedWorkouts = workoutIdsWithExercises.length;
      
      workoutData.forEach(workout => {
        const hasExercises = workoutIdsWithExercises.includes(workout.id);
        console.log(`Workout ${workout.id}: has ${hasExercises ? 'exercises' : 'no exercises'}`);
      });
      
      console.log('Completed workouts found:', completedWorkouts);
      console.log('=== END DASHBOARD STATS DEBUG ===');
      
      setTotalWorkouts(completedWorkouts);
      setError(null);
    } catch (error) {
      console.error('Error fetching total workouts:', error);
      setError('Failed to load workout stats');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
        <h3 className="text-gray-600 text-sm uppercase tracking-wider mb-2">Current Week</h3>
        <div className="text-4xl font-bold text-blue-500 mb-1">{currentWeek}</div>
        <div className="text-gray-500 text-sm">X3 Program</div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
        <h3 className="text-gray-600 text-sm uppercase tracking-wider mb-2">Today's Workout</h3>
        <div className="text-4xl font-bold text-blue-500 mb-1">{todaysWorkout}</div>
        <div className="text-gray-500 text-sm">{new Date().toLocaleDateString()}</div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
        <h3 className="text-gray-600 text-sm uppercase tracking-wider mb-2">Total Workouts</h3>
        <div className="text-4xl font-bold text-blue-500 mb-1">
          {error ? '?' : totalWorkouts}
        </div>
        <div className="text-gray-500 text-sm">
          {error ? 'Error loading' : 'Completed'}
        </div>
      </div>
    </div>
  );
};
