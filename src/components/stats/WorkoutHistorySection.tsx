import React from 'react';
import { TimeRange } from '@/types/stats';
import { getTimeRangeLabel } from '@/utils/time-range';
import { WorkoutHistory } from '@/components/WorkoutHistory'; // Fixed import path

interface WorkoutHistorySectionProps {
  timeRange: TimeRange;
}

const mapTimeRangeToHistoryRange = (timeRange: TimeRange): 'week' | 'month' | '6months' | 'all' => {
  switch (timeRange) {
    case '7days':
      return 'week';
    case '1month':
      return 'month';
    case '3months':
      return '6months';
    case 'alltime':
      return 'all';
    default:
      return 'week';
  }
};

export const WorkoutHistorySection: React.FC<WorkoutHistorySectionProps> = ({ timeRange }) => {
  return (
    <div className="brand-card">
      <h2 className="text-subhead mb-6">
        {getTimeRangeLabel(timeRange)} Workouts
      </h2>
      <WorkoutHistory 
        key={timeRange} // Force re-render when time range changes
        defaultRange={mapTimeRangeToHistoryRange(timeRange)}
        showTitle={false}
        compact={false}
      />
    </div>
  );
};