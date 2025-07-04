
import { supabase } from '@/integrations/supabase/client';

export const deleteExerciseById = async (exerciseId: number): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting exercise with ID: ${exerciseId}`);
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }

    console.log(`✅ Successfully deleted exercise ${exerciseId}`);
    return true;
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return false;
  }
};

export const deleteExerciseByWorkoutAndName = async (
  userId: string, 
  workoutId: number, 
  exerciseName: string
): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting ${exerciseName} from workout ${workoutId}`);
    
    // Ensure userId is converted to string for consistency
    const userIdString = String(userId);
    
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('user_id', userIdString)
      .eq('workout_id', workoutId)
      .eq('exercise_name', exerciseName);

    if (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }

    console.log(`✅ Successfully deleted ${exerciseName} from workout`);
    return true;
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return false;
  }
};
