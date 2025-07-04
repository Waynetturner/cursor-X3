
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekAndDay } from '@/utils/workoutUtils';

export const useWorkoutCreation = (userId: string | undefined) => {
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentWeek, todaysWorkout } = getWeekAndDay();

  useEffect(() => {
    if (!userId) {
      console.log('❌ No userId provided to useWorkoutCreation');
      setIsLoading(false);
      return;
    }

    console.log('=== 🏋️ WORKOUT CREATION START ===');
    console.log('👤 User:', userId);
    console.log('🗓️ Today\'s workout:', todaysWorkout);
    console.log('📅 Current week:', currentWeek);
    
    const createOrFindWorkout = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        console.log('🔍 Searching for existing workout for date:', today);
        
        // Look for existing workout for today - use userId directly
        const { data: existingWorkouts, error: findError } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', userId)
          .eq('date', today)
          .eq('workout_type', todaysWorkout);

        if (findError) {
          console.error('❌ Error finding existing workouts:', findError);
          setWorkoutId(null);
          setIsLoading(false);
          return;
        }

        console.log('📋 Existing workouts found:', existingWorkouts);

        // If we found an existing workout, use it
        if (existingWorkouts && existingWorkouts.length > 0) {
          const existingId = existingWorkouts[0].id;
          console.log(`✅ Using existing workout ID: ${existingId}`);
          setWorkoutId(existingId);
          setIsLoading(false);
          return;
        }

        // No existing workout found, create a new one
        console.log('🆕 No existing workout found, creating new one');
        
        const { data: newWorkout, error: createError } = await supabase
          .from('workouts')
          .insert({
            user_id: userId, // Use userId directly
            date: today,
            workout_type: todaysWorkout,
            week_number: currentWeek
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error creating workout:', createError);
          console.error('❌ Create error details:', createError.message, createError.details);
          setWorkoutId(null);
          setIsLoading(false);
          return;
        }

        if (!newWorkout || !newWorkout.id) {
          console.error('❌ Created workout but no ID returned:', newWorkout);
          setWorkoutId(null);
          setIsLoading(false);
          return;
        }

        console.log(`✅ Successfully created new workout with ID: ${newWorkout.id}`);
        setWorkoutId(newWorkout.id);
        setIsLoading(false);

      } catch (error) {
        console.error('❌ Unexpected error in createOrFindWorkout:', error);
        setWorkoutId(null);
        setIsLoading(false);
      }
    };

    // Reset state and start the process
    setWorkoutId(null);
    setIsLoading(true);
    createOrFindWorkout();
    
    console.log('=== 🏋️ WORKOUT CREATION END ===');
  }, [userId, currentWeek, todaysWorkout]);

  return {
    workoutId,
    currentWeek,
    todaysWorkout,
    isLoading
  };
};
