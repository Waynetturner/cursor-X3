import React from 'react';
import { WorkoutStats } from '@/types/stats';

interface StreakInfoSectionProps {
  stats: WorkoutStats | null;
}

export const StreakInfoSection: React.FC<StreakInfoSectionProps> = ({ stats }) => {
  return (
    <div className="brand-card mb-8">
      <h3 className="text-body-large font-semibold mb-4">🔥 Streak Information</h3>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-body-small text-gray-700 mb-2">
          <strong>Current Streak:</strong> {stats?.currentStreak || 0} consecutive days following the X3 schedule
        </p>
        <p className="text-body-small text-gray-600 mb-2">
          Your streak includes both workout days and scheduled rest days. Missing a scheduled workout breaks the streak.
        </p>
        <p className="text-body-small text-gray-600">
          <strong>Schedule:</strong> Weeks 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest • Weeks 5+: Push/Pull/Push/Pull/Push/Pull/Rest
        </p>
      </div>
    </div>
  );
};