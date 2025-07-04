
import React from 'react';

export const WelcomeStep = () => {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🏋️‍♂️</div>
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome to PapaFit X3!
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        You're about to embark on a revolutionary fitness journey using variable resistance training. 
        The X3 system is designed to build maximum strength and muscle in minimal time.
      </p>
      <div className="bg-blue-50 p-6 rounded-lg max-w-2xl mx-auto">
        <h3 className="font-semibold text-gray-900 mb-2">What makes X3 different?</h3>
        <ul className="text-left space-y-2 text-gray-700">
          <li>✅ <strong>Variable resistance</strong> - matches your strength curve</li>
          <li>✅ <strong>Time efficient</strong> - just 10-15 minutes per workout</li>
          <li>✅ <strong>Proven results</strong> - science-backed muscle building</li>
          <li>✅ <strong>Joint friendly</strong> - lower injury risk than weights</li>
        </ul>
      </div>
      <p className="text-gray-600">
        Let's take a few minutes to set up your profile and get you ready for success!
      </p>
    </div>
  );
};
