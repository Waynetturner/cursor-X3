
import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChatMessages } from './coach/ChatMessages';
import { ChatInput } from './coach/ChatInput';
import { useCoachChat } from '@/hooks/useCoachChat';
import { getWeekAndDay } from '@/utils/workoutUtils';

interface CoachSectionProps {
  workoutCompleted?: boolean;
  onWorkoutFinished?: () => void;
}

export const CoachSection = ({ workoutCompleted = false, onWorkoutFinished }: CoachSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const { 
    messages, 
    inputMessage, 
    setInputMessage, 
    isLoading, 
    sendMessage,
    sendWorkoutCompleteMessage,
    hasAnalyzedWorkout
  } = useCoachChat();
  const { currentWeek, todaysWorkout } = getWeekAndDay();

  if (!user) return null;

  const handleSendMessage = async () => {
    await sendMessage();
    // Keep the chat expanded and in view after sending
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleWorkoutComplete = async () => {
    console.log('Workout complete button clicked', {
      workoutCompleted,
      hasAnalyzedWorkout,
      isLoading
    });
    
    await sendWorkoutCompleteMessage();
    // Expand the chat to show the coach's response
    if (!isExpanded) {
      setIsExpanded(true);
    }
    // Call the parent callback if provided
    if (onWorkoutFinished) {
      onWorkoutFinished();
    }
  };

  // Debug log for button state
  console.log('Coach section render state:', {
    todaysWorkout,
    workoutCompleted,
    hasAnalyzedWorkout,
    isLoading,
    buttonDisabled: isLoading || hasAnalyzedWorkout || !workoutCompleted
  });

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Your X3 Coach
          </CardTitle>
          <div className="flex gap-2">
            {todaysWorkout !== 'Rest' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWorkoutComplete}
                disabled={isLoading || hasAnalyzedWorkout || !workoutCompleted}
                className={`text-white border-orange-400 hover:border-orange-500 ${(hasAnalyzedWorkout || !workoutCompleted) ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  backgroundColor: (hasAnalyzedWorkout || !workoutCompleted) ? undefined : '#f27d20',
                  color: (hasAnalyzedWorkout || !workoutCompleted) ? '#f27d20' : 'white'
                }}
              >
                {isLoading ? 'Analyzing...' : hasAnalyzedWorkout ? 'Workout Analyzed' : 'Finish Workout & Get Coach Analysis'}
              </Button>
            )}
            <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Chat
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-2xl">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Your X3 Coach
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full pt-6">
                  <div className="flex-1 overflow-hidden mb-4">
                    <ChatMessages messages={messages} isLoading={isLoading} />
                  </div>
                  <div className="flex-shrink-0">
                    <ChatInput
                      inputMessage={inputMessage}
                      setInputMessage={setInputMessage}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Get personalized guidance for your X3 training
        </p>
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-2">
            Debug: Completed={workoutCompleted.toString()}, Analyzed={hasAnalyzedWorkout.toString()}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};
