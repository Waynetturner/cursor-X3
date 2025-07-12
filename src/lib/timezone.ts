/**
 * Timezone utilities for X3 Momentum Pro
 * Handles Central time (CDT/CST) with proper DST transitions
 */

import { format, parseISO, startOfDay, endOfDay, subDays, subMonths } from 'date-fns'
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz'

// Central Time Zone - automatically handles DST
const CENTRAL_TIMEZONE = 'America/Chicago'

export interface TimezoneUtils {
  // Convert dates to/from Central time
  toUTC: (centralDate: Date) => Date
  toCentral: (utcDate: Date) => Date
  
  // Format dates in Central time
  formatCentral: (date: Date, formatStr: string) => string
  
  // Get current Central time
  nowInCentral: () => Date
  
  // Date helpers in Central time
  startOfDayInCentral: (date: Date) => Date
  endOfDayInCentral: (date: Date) => Date
  
  // Date range helpers for workout history
  getDateRange: (range: 'week' | 'month' | '6months') => { start: string; end: string }
  
  // Parse workout timestamps correctly
  parseWorkoutTimestamp: (timestamp: string) => Date
  getLocalDateFromTimestamp: (timestamp: string) => string
}

/**
 * Convert a date in Central timezone to UTC
 */
function toUTC(centralDate: Date): Date {
  return fromZonedTime(centralDate, CENTRAL_TIMEZONE)
}

/**
 * Convert a UTC date to Central timezone
 */
function toCentral(utcDate: Date): Date {
  return toZonedTime(utcDate, CENTRAL_TIMEZONE)
}

/**
 * Format a date in Central timezone
 */
function formatCentral(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return formatInTimeZone(date, CENTRAL_TIMEZONE, formatStr)
}

/**
 * Get current time in Central timezone
 */
function nowInCentral(): Date {
  return toCentral(new Date())
}

/**
 * Get start of day in Central timezone
 */
function startOfDayInCentral(date: Date): Date {
  const centralDate = toCentral(date)
  return startOfDay(centralDate)
}

/**
 * Get end of day in Central timezone
 */
function endOfDayInCentral(date: Date): Date {
  const centralDate = toCentral(date)
  return endOfDay(centralDate)
}

/**
 * Get date range for workout history queries
 * Returns dates in YYYY-MM-DD format for Central timezone
 */
function getDateRange(range: 'week' | 'month' | '6months'): { start: string; end: string } {
  const now = nowInCentral()
  const today = startOfDayInCentral(now)
  
  let startDate: Date
  
  switch (range) {
    case 'week':
      startDate = subDays(today, 7)
      break
    case 'month':
      startDate = subMonths(today, 1)
      break
    case '6months':
      startDate = subMonths(today, 6)
      break
    default:
      startDate = today
  }
  
  return {
    start: formatCentral(startDate, 'yyyy-MM-dd'),
    end: formatCentral(today, 'yyyy-MM-dd')
  }
}

/**
 * Parse a workout timestamp string correctly
 * Handles both ISO strings with timezone and without
 */
function parseWorkoutTimestamp(timestamp: string): Date {
  try {
    // If timestamp already includes timezone info, parse directly
    if (timestamp.includes('T') && (timestamp.includes('+') || timestamp.includes('Z'))) {
      return parseISO(timestamp)
    }
    
    // If timestamp is just date portion, treat as Central timezone
    if (timestamp.includes('T')) {
      // Has time but no timezone - assume it's already in Central time
      const parsed = parseISO(timestamp)
      return toCentral(parsed)
    } else {
      // Just date portion - treat as start of day in Central time
      const parsed = parseISO(timestamp + 'T00:00:00')
      return toCentral(parsed)
    }
  } catch (error) {
    console.error('Error parsing workout timestamp:', timestamp, error)
    return new Date()
  }
}

/**
 * Extract local date from workout timestamp
 * Returns YYYY-MM-DD format in Central timezone
 */
function getLocalDateFromTimestamp(timestamp: string): string {
  try {
    const date = parseWorkoutTimestamp(timestamp)
    const centralDate = toCentral(date)
    const localDateStr = formatCentral(centralDate, 'yyyy-MM-dd')
    
    // Debug logging commented out - was useful for debugging date display issue
    // console.log('🕐 Timezone conversion:', {
    //   input: timestamp,
    //   parsed: date.toISOString(),
    //   central: centralDate.toISOString(),
    //   localDate: localDateStr
    // })
    
    return localDateStr
  } catch (error) {
    console.error('Error extracting local date from timestamp:', timestamp, error)
    // Fallback to simple string split
    return timestamp.split('T')[0]
  }
}

/**
 * Get current local ISO date-time string in Central timezone
 * For saving to database
 */
function getCurrentCentralISOString(): string {
  const centralNow = nowInCentral()
  // Convert back to UTC and format as ISO string for database storage
  const utcEquivalent = toUTC(centralNow)
  return utcEquivalent.toISOString()
}

/**
 * Create a local ISO string for a specific Central timezone date/time
 */
function createCentralISOString(centralDate: Date): string {
  const utcEquivalent = toUTC(centralDate)
  return utcEquivalent.toISOString()
}

/**
 * Check if DST is currently in effect in Central timezone
 */
function isDSTActive(date: Date = new Date()): boolean {
  const centralDate = toCentral(date)
  const january = new Date(centralDate.getFullYear(), 0, 1)
  const july = new Date(centralDate.getFullYear(), 6, 1)
  
  const janOffset = toCentral(january).getTimezoneOffset()
  const julOffset = toCentral(july).getTimezoneOffset()
  const currentOffset = centralDate.getTimezoneOffset()
  
  return currentOffset === Math.min(janOffset, julOffset)
}

/**
 * Get timezone offset string for Central time
 */
function getCentralTimezoneOffset(date: Date = new Date()): string {
  const isDST = isDSTActive(date)
  return isDST ? 'CDT (UTC-5)' : 'CST (UTC-6)'
}

// Export the utility functions
export const timezoneUtils: TimezoneUtils = {
  toUTC,
  toCentral,
  formatCentral,
  nowInCentral,
  startOfDayInCentral,
  endOfDayInCentral,
  getDateRange,
  parseWorkoutTimestamp,
  getLocalDateFromTimestamp
}

// Export additional utilities
export {
  getCurrentCentralISOString,
  createCentralISOString,
  isDSTActive,
  getCentralTimezoneOffset,
  CENTRAL_TIMEZONE
}

// Export for backward compatibility
export { getLocalDateFromTimestamp as getLocalDateFromStoredTime }