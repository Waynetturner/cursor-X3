import React from 'react';
import { BarChart3, Calendar, Flame, Trophy } from 'lucide-react';
import { WorkoutStats, TimeRange } from '@/types/stats';
import { getTimeRangeLabel } from '@/utils/time-range';

interface StatsGridProps {
  stats: WorkoutStats | null;
  timeRange: TimeRange;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, timeRange }) => {
  return (
    <div className="stats-grid mb-8">
      <div className="brand-card text-center">
        <div className="flex items-center justify-center mb-4">
          <BarChart3 className="brand-fire" size={32} />
        </div>
        <h3 className="text-body-large font-semibold mb-2">
          Workouts ({getTimeRangeLabel(timeRange)})
        </h3>
        <p className="text-headline brand-fire">{stats?.totalWorkouts || 0}</p>
      </div>

      <div className="brand-card text-center">
        <div className="flex items-center justify-center mb-4">
          <Flame className="brand-fire" size={32} />
        </div>
        <h3 className="text-body-large font-semibold mb-2">Current Streak</h3>
        <p className="text-headline brand-fire">{stats?.currentStreak || 0} days</p>
        <p className="text-body-small text-gray-500 mt-1">All time</p>
      </div>

      <div className="brand-card text-center">
        <div className="flex items-center justify-center mb-4">
          <Calendar className="brand-fire" size={32} />
        </div>
        <h3 className="text-body-large font-semibold mb-2">Current Week</h3>
        <p className="text-headline brand-fire">Week {stats?.currentWeek || 1}</p>
        <p className="text-body-small text-gray-500 mt-1">Program progress</p>
      </div>

      <div className="brand-card text-center">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="brand-fire" size={32} />
        </div>
        <h3 className="text-body-large font-semibold mb-2">Longest Streak</h3>
        <p className="text-headline brand-fire">{stats?.longestStreak || 0} days</p>
        <p className="text-body-small text-gray-500 mt-1">All time</p>
      </div>
    </div>
  );
};