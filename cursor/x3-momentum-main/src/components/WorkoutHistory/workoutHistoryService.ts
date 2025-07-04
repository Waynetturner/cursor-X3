
import { supabase } from '@/integrations/supabase/client';
import { getDateCutoff } from './utils';
import { TimeRange } from './types';

export const fetchWorkouts = async (userId: string, currentRange: TimeRange) => {
  console.log('=== WORKOUT QUERY DEBUG ===');
  console.log('Fetching workout data for user:', userId);
  console.log('Range:', currentRange);

  // Apply the date filter
  let query = supabase
    .from('workouts')
    .select(`
      id,
      date,
      workout_type,
      week_number,
      created_at,
      user_id
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  const dateCutoff = getDateCutoff(currentRange);
  if (dateCutoff) {
    console.log('Applying date filter:', dateCutoff);
    query = query.gte('date', dateCutoff);
  } else {
    console.log('No date filter applied (showing all)');
  }

  const { data: workoutData, error } = await query;

  if (error) {
    console.error('Error fetching filtered workout data:', error);
    throw error;
  }

  console.log('FILTERED workout data returned:', workoutData);
  console.log('Number of filtered workouts returned:', workoutData?.length || 0);
  console.log('=== END WORKOUT QUERY DEBUG ===');

  return workoutData || [];
};

export const fetchExercises = async (userId: string, workoutIds: number[]) => {
  console.log('=== CHECKING DATA RELATIONSHIP ===');
  console.log('Fetching exercises for workout IDs:', workoutIds);
  console.log('User ID:', userId);

  // First, let's check what exercises actually exist in the database
  console.log('=== CHECKING ALL EXERCISES IN DATABASE ===');
  const { data: allExercises, error: allExercisesError } = await supabase
    .from('exercises')
    .select('id, workout_id, exercise_name, user_id')
    .limit(20);

  if (allExercisesError) {
    console.error('Error fetching all exercises:', allExercisesError);
  } else {
    console.log('ALL EXERCISES IN DATABASE (first 20):');
    console.log(allExercises);
    console.log('Unique workout_ids in exercises:', [...new Set(allExercises?.map(e => e.workout_id) || [])]);
  }

  // Check exercises for this specific user
  const { data: userExercises, error: userExerciseError } = await supabase
    .from('exercises')
    .select('id, workout_id, exercise_name, user_id')
    .eq('user_id', userId);

  if (userExerciseError) {
    console.error('Error fetching user exercises:', userExerciseError);
  } else {
    console.log('USER EXERCISES:', userExercises);
    console.log('User exercise workout_ids:', userExercises?.map(e => e.workout_id) || []);
  }

  // Check if there's any intersection between workout IDs and exercise workout_ids
  const userExerciseWorkoutIds = userExercises?.map(e => e.workout_id) || [];
  const matchingIds = workoutIds.filter(id => userExerciseWorkoutIds.includes(id));
  
  console.log('Requested workout IDs:', workoutIds);
  console.log('Exercise workout_ids for user:', userExerciseWorkoutIds);
  console.log('Matching IDs:', matchingIds);

  if (matchingIds.length === 0 && workoutIds.length > 0 && userExerciseWorkoutIds.length > 0) {
    console.log('🚨 CONFIRMED: NO MATCHING WORKOUT-EXERCISE RELATIONSHIPS');
    console.log('This is a data inconsistency issue that needs to be resolved.');
    console.log('Workouts exist with IDs:', workoutIds);
    console.log('But exercises reference workout_ids:', userExerciseWorkoutIds);
  }

  // Continue with the standard exercise query for the requested workout IDs
  const { data: exerciseData, error } = await supabase
    .from('exercises')
    .select('*')
    .in('workout_id', workoutIds)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }

  console.log('Exercise data returned for requested workout IDs:', exerciseData?.length || 0, 'exercises');
  console.log('=== END DATA RELATIONSHIP CHECK ===');

  return exerciseData || [];
};

// New function to help fix data inconsistency
export const createTestExercisesForWorkout = async (userId: string, workoutId: number, workoutType: string) => {
  console.log(`Creating test exercises for workout ${workoutId} (${workoutType})`);
  
  // Define exercises based on workout type
  const pushExercises = ['Chest Press', 'Overhead Press', 'Tricep Press'];
  const pullExercises = ['Bentover Row', 'High Pull', 'Bicep Curl'];
  const exercises = workoutType === 'Push' ? pushExercises : pullExercises;
  
  // Create test exercise data
  const testExercises = exercises.map(exerciseName => ({
    user_id: userId,
    workout_id: workoutId,
    exercise_name: exerciseName,
    band_color: 'Red',
    full_reps: 15,
    partial_reps: 10,
    notes: 'Test exercise created to fix data inconsistency'
  }));

  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert(testExercises)
      .select();

    if (error) {
      console.error('Error creating test exercises:', error);
      return { success: false, error };
    }

    console.log('Successfully created test exercises:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error creating test exercises:', error);
    return { success: false, error };
  }
};

// Function to check and potentially fix data inconsistency
export const checkAndFixDataInconsistency = async (userId: string, workoutIds: number[]) => {
  console.log('=== CHECKING AND FIXING DATA INCONSISTENCY ===');
  
  // Check if there are any exercises for the user
  const { data: userExercises } = await supabase
    .from('exercises')
    .select('workout_id')
    .eq('user_id', userId);

  const userExerciseWorkoutIds = userExercises?.map(e => e.workout_id) || [];
  const hasMatchingIds = workoutIds.some(id => userExerciseWorkoutIds.includes(id));

  if (!hasMatchingIds && workoutIds.length > 0) {
    console.log('No matching workout-exercise relationships found');
    console.log('Available options:');
    console.log('1. Create test exercises for existing workouts');
    console.log('2. Clear all data and start fresh');
    console.log('3. Check if exercises exist for different user_id');
    
    return {
      hasDataInconsistency: true,
      workoutIds,
      userExerciseWorkoutIds,
      suggestions: [
        'Create test exercises for existing workouts',
        'Clear all workout/exercise data and start fresh',
        'Check if exercises exist for different user_id'
      ]
    };
  }

  return { hasDataInconsistency: false };
};
