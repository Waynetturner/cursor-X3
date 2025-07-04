
import React from 'react';
import { Play, Clock, Target, Award } from 'lucide-react';
import { getWeekAndDay } from '@/utils/workoutUtils';

export const FirstWorkoutStep = () => {
  const { todaysWorkout, currentWeek } = getWeekAndDay();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Play className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ready for Your First Workout!
        </h2>
        <p className="text-gray-600">
          Your personalized X3 journey starts today
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg text-center">
        <h3 className="text-xl font-semibold mb-2">
          Today's Workout: {todaysWorkout === 'Rest' ? 'Rest Day' : `${todaysWorkout} Day`}
        </h3>
        <p className="opacity-90">Week {currentWeek} of your X3 Program</p>
      </div>

      {todaysWorkout !== 'Rest' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              Today's Exercises
            </h3>
            <div className="space-y-3">
              {todaysWorkout === 'Push' ? (
                <>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Chest Press</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Tricep Press</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Overhead Press</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Front Squat</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Deadlift</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Bent Row</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Bicep Curl</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Calf Raise</div>
                    <div className="text-sm text-gray-600">Full range + partials</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-500" />
              Workout Tips
            </h3>
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-900">Start Light</div>
                <div className="text-sm text-blue-700">Begin with lighter resistance to learn proper form</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-medium text-green-900">Focus on Form</div>
                <div className="text-sm text-green-700">Full range of motion is more important than resistance level</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-medium text-purple-900">Track Everything</div>
                <div className="text-sm text-purple-700">Log your reps and resistance to see your progress</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Rest Day</h3>
          <p className="text-gray-600">
            Great timing! Today is a rest day. Take time to recover and prepare for tomorrow's workout.
            You can still explore the app and set up your profile.
          </p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">🎯 First Workout Goals</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Learn the movement patterns</li>
          <li>• Find your starting resistance level</li>
          <li>• Get comfortable with the app</li>
          <li>• Don't worry about perfect numbers yet!</li>
        </ul>
      </div>
    </div>
  );
};
