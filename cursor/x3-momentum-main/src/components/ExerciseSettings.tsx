
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export const ExerciseSettings = () => {
  const pushExercises = ['Chest Press', 'Tricep Press', 'Overhead Press', 'Front Squat'];
  const pullExercises = ['Deadlift', 'Bent Row', 'Bicep Curl', 'Calf Raise'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-blue-600">
        <Info className="h-4 w-4" />
        <span className="text-sm">Exercise settings and alternates coming soon</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Exercise Order</CardTitle>
          <CardDescription>
            Standard X3 exercises for weeks 1-4. Your workouts will display exercises in this order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Push Day Exercises</h4>
            <div className="flex flex-wrap gap-2">
              {pushExercises.map((exercise, index) => (
                <Badge key={exercise} variant="secondary" className="bg-blue-100 text-blue-800">
                  {index + 1}. {exercise}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Pull Day Exercises</h4>
            <div className="flex flex-wrap gap-2">
              {pullExercises.map((exercise, index) => (
                <Badge key={exercise} variant="secondary" className="bg-green-100 text-green-800">
                  {index + 1}. {exercise}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alternate Exercises</CardTitle>
          <CardDescription>
            After week 4, additional exercise options become available. This section will allow you to customize your workout selections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Alternate exercise settings will be available here</p>
            <p className="text-sm mt-1">Perfect for weeks 5-12 customization</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
