import React from 'react';
import { TimeRange, TimeRangeOption } from '@/types/stats';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { key: '7days', label: 'Last 7 Days' },
  { key: '1month', label: 'Last Month' },
  { key: '3months', label: 'Last 3 Months' },
  { key: 'alltime', label: 'All Time' }
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange
}) => {
  return (
    <div className="brand-card mb-4">
      <h3 className="text-body-large font-semibold mb-4">Time Range</h3>
      <div className="flex flex-wrap gap-2">
        {TIME_RANGE_OPTIONS.map((range) => (
          <button
            key={range.key}
            onClick={() => onRangeChange(range.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedRange === range.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};