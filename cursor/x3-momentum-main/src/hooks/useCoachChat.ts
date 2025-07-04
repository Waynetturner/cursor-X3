
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getWeekAndDay } from '@/utils/workoutUtils';
import { useCoachMessages } from './useCoachMessages';
import { useWorkoutAnalysis } from './useWorkoutAnalysis';
import { getUserDemographics, saveUserMessage, callCoachAPI } from '@/services/coachService';

export const useCoachChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const {
    messages,
    addMessage,
    createUserMessage,
    createCoachMessage,
    createErrorMessage
  } = useCoachMessages(user?.id);

  const {
    hasAnalyzedWorkout,
    setHasAnalyzedWorkout,
    getTodaysWorkoutData
  } = useWorkoutAnalysis(user?.id);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;

    const userMessage = createUserMessage(inputMessage);
    addMessage(userMessage);
    
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending user message:', currentMessage);

      // Save user message to database
      await saveUserMessage(user.id, currentMessage);

      // Get user demographics for personalized coaching
      const demographics = await getUserDemographics(user.id);

      // Check if the user is asking about their workout
      const isAskingAboutWorkout = currentMessage.toLowerCase().includes('workout') && 
        (currentMessage.toLowerCase().includes('today') || 
         currentMessage.toLowerCase().includes('my workout') ||
         currentMessage.toLowerCase().includes('what can you tell me'));

      let messageToSend = currentMessage;
      let isWorkoutAnalysis = false;

      // If they're asking about their workout, try to get today's data
      if (isAskingAboutWorkout) {
        console.log('User asking about workout, attempting to get workout data...');
        try {
          const workoutData = await getTodaysWorkoutData();
          
          if (workoutData && workoutData.exercises.length > 0) {
            const { currentWeek, todaysWorkout } = getWeekAndDay();
            
            // Format the workout data for the coach
            const exercisesList = workoutData.exercises.map(exercise => {
              return `${exercise.exercise_name}: ${exercise.full_reps} full reps${exercise.partial_reps > 0 ? ` + ${exercise.partial_reps} partial reps` : ''} using ${exercise.band_color} band${exercise.notes ? ` (Notes: "${exercise.notes}")` : ''}`;
            }).join('\n');

            messageToSend = `The user is asking about their workout today. Here are the details of their ${todaysWorkout} workout from Week ${currentWeek} that they completed today:

${exercisesList}

Please analyze this specific workout data and provide personalized feedback based on these exact exercises, reps, and band colors they used. Their original question was: "${currentMessage}"`;
            
            isWorkoutAnalysis = true;
            console.log('Found workout data, sending for analysis:', exercisesList);
          } else {
            console.log('No workout data found for today');
            messageToSend = `${currentMessage}

Note: I don't see any workout data recorded for today yet. If you've completed a workout today, please make sure to log your exercises first, then I can provide specific feedback on your performance.`;
          }
        } catch (error) {
          console.error('Error getting workout data:', error);
          messageToSend = `${currentMessage}

Note: I'm having trouble accessing your workout data right now. If you've completed a workout today, please try logging your exercises and asking again.`;
        }
      }

      // Call the AI coach edge function
      console.log('Calling coach-chat function...');
      const data = await callCoachAPI(messageToSend, user.id, messages, demographics, isWorkoutAnalysis);

      console.log('Coach response received:', data);

      const coachMessage = createCoachMessage(data.response);
      addMessage(coachMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = createErrorMessage();
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendWorkoutCompleteMessage = async () => {
    if (!user || isLoading || hasAnalyzedWorkout) return;

    setIsLoading(true);

    try {
      const { currentWeek, todaysWorkout } = getWeekAndDay();
      const workoutData = await getTodaysWorkoutData();
      const demographics = await getUserDemographics(user.id);

      if (!workoutData || workoutData.exercises.length === 0) {
        throw new Error('No workout data found for today');
      }

      // Format the workout data clearly for the coach
      const exercisesList = workoutData.exercises.map(exercise => {
        return `${exercise.exercise_name}: ${exercise.full_reps} full reps${exercise.partial_reps > 0 ? ` + ${exercise.partial_reps} partial reps` : ''} using ${exercise.band_color} band${exercise.notes ? ` (Notes: "${exercise.notes}")` : ''}`;
      }).join('\n');

      // Create a clear, structured message for the coach
      const workoutCompleteMessage = `I just finished my ${todaysWorkout} workout for Week ${currentWeek}. Here are the details of what I actually completed today:

${exercisesList}

Please analyze this workout and provide specific feedback based on these exact exercises, reps, and band colors. Consider my notes for each exercise and give me recommendations for progression.`;

      console.log('Sending workout analysis message:', workoutCompleteMessage);

      // Call the AI coach edge function
      const data = await callCoachAPI(
        workoutCompleteMessage,
        user.id,
        messages,
        demographics,
        true
      );

      console.log('Coach workout complete response received:', data);

      const coachMessage = createCoachMessage(data.response);
      addMessage(coachMessage);
      setHasAnalyzedWorkout(true);
    } catch (error) {
      console.error('Error sending workout complete message:', error);
      const errorMessage = createErrorMessage();
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    sendMessage,
    sendWorkoutCompleteMessage,
    hasAnalyzedWorkout
  };
};
