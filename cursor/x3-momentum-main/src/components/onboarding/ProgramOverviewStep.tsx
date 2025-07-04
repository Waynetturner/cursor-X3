
import React from 'react';
import { Calendar, Target, TrendingUp, Clock } from 'lucide-react';

export const ProgramOverviewStep = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          The X3 12-Week Program
        </h2>
        <p className="text-gray-600">
          A scientifically designed progression system that adapts to your growing strength
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Weeks 1-4: Foundation</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• 4 workouts per week (Push/Pull alternating)</li>
              <li>• Focus on form and technique</li>
              <li>• Build movement patterns</li>
              <li>• 2 rest days per week</li>
            </ul>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Weeks 5-12: Progression</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• 6 workouts per week</li>
              <li>• Maximum strength development</li>
              <li>• Advanced resistance levels</li>
              <li>• 1 rest day per week</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <Clock className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Daily Workouts</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>Push Days:</strong> Chest, Shoulders, Triceps, Legs</li>
              <li>• <strong>Pull Days:</strong> Back, Biceps, Calves</li>
              <li>• 4 exercises per workout</li>
              <li>• 10-15 minutes total time</li>
            </ul>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Key Principles</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>Variable resistance:</strong> Matches strength curve</li>
              <li>• <strong>Full range:</strong> Complete stretch to full contraction</li>
              <li>• <strong>Partials:</strong> Extra reps at strongest position</li>
              <li>• <strong>Progressive overload:</strong> Increase resistance weekly</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="font-semibold mb-2">📈 Expected Results</h3>
        <p className="text-sm opacity-90">
          Most users see significant strength gains within 4 weeks and major physique changes by week 8. 
          The X3 system is designed to produce results faster than traditional weight training while being 
          safer for your joints and more time efficient.
        </p>
      </div>
    </div>
  );
};
