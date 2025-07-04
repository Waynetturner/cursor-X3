
import React from 'react';
import { CheckCircle, Zap, Target, Users } from 'lucide-react';

export const CompletionStep = () => {
  return (
    <div className="text-center space-y-6">
      <div>
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          You're All Set! 🎉
        </h2>
        <p className="text-lg text-gray-600">
          Welcome to the PapaFit X3 community. Your transformation starts now!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="bg-blue-50 p-6 rounded-lg">
          <Zap className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
          <p className="text-sm text-gray-600">
            Log every workout and watch your strength grow week by week
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <Target className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Stay Consistent</h3>
          <p className="text-sm text-gray-600">
            Follow the program schedule for maximum results
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Get Coaching</h3>
          <p className="text-sm text-gray-600">
            Use the AI coach for personalized guidance and motivation
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg max-w-2xl mx-auto">
        <h3 className="font-semibold mb-2">🚀 Ready to Begin?</h3>
        <p className="text-sm opacity-90 mb-4">
          Your X3 journey awaits. Remember: consistency beats perfection. Start where you are, 
          use what you have, and do what you can. Every workout gets you stronger!
        </p>
        <p className="text-xs opacity-80">
          💡 Tip: You can always update your profile and preferences in the settings menu
        </p>
      </div>
    </div>
  );
};
