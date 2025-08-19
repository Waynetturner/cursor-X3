import { TimeRange } from '@/types/stats';

export interface TimeRangeDates {
  startDate: Date;
  endDate: Date;
}

/**
 * Calculate start and end dates for a given time range
 */
export function getTimeRangeDates(timeRange: TimeRange): TimeRangeDates {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  let startDate: Date;
  
  switch (timeRange) {
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3months':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'alltime':
      // For alltime, we use a very old date
      startDate = new Date('2020-01-01');
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  startDate.setHours(0, 0, 0, 0);
  
  return {
    startDate,
    endDate: now
  };
}

/**
 * Get the display label for a time range
 */
export function getTimeRangeLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case '7days':
      return 'Last 7 Days';
    case '1month':
      return 'Last Month';
    case '3months':
      return 'Last 3 Months';
    case 'alltime':
      return 'All Time';
    default:
      return 'Last 7 Days';
  }
}

/**
 * Check if a date falls within a time range
 */
export function isDateInTimeRange(date: Date, timeRange: TimeRange): boolean {
  const { startDate, endDate } = getTimeRangeDates(timeRange);
  return date >= startDate && date <= endDate;
}

/**
 * Format a date for database queries (YYYY-MM-DD format)
 */
export function formatDateForQuery(date: Date): string {
  return date.toISOString().split('T')[0];
}