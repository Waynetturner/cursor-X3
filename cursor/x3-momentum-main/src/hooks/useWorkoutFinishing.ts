
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWorkoutFinishing = (
  userId: string | undefined,
  workoutId: number | null,
  todaysWorkout: string,
  currentWeek: number
) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const finishWorkout = async () => {
    if (!userId || !workoutId) return;

    setIsAnalyzing(true);
    
    try {
      // Get today's workout data
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .eq('user_id', userId);

      if (exercisesError) throw exercisesError;

      // Prepare workout summary for the coach
      const workoutSummary = {
        workoutType: todaysWorkout,
        date: new Date().toISOString().split('T')[0],
        exercises: exercises || [],
        weekNumber: currentWeek
      };

      // Call coach function for workout analysis
      const { data: coachResponse, error: coachError } = await supabase.functions.invoke('coach-chat', {
        body: {
          message: `Please analyze my completed ${todaysWorkout} workout from today and provide recommendations for my next session. Here's my workout data: ${JSON.stringify(workoutSummary)}`,
          userId: userId,
          conversationHistory: [],
          isWorkoutAnalysis: true
        }
      });

      if (coachError) throw coachError;

      toast({
        title: "Workout Complete! 🎉",
        description: "Your coach has analyzed your workout. Check the coach section for recommendations."
      });

    } catch (error) {
      console.error('Error finishing workout:', error);
      toast({
        title: "Error",
        description: "Failed to analyze workout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    finishWorkout
  };
};
