/**
 * Data Transformation Utilities
 * 
 * Centralized utility functions for consistent data transformation across the application.
 * Eliminates code duplication and ensures consistent formatting throughout the X3 Tracker.
 * 
 * Usage:
 * - Use DataTransformer.formatWorkoutDate() for consistent date formatting
 * - Use DataTransformer.calculateBandRank() for unified band hierarchy
 * - Use DataTransformer.formatExerciseDisplay() for consistent exercise names
 */

import { BandColor } from '@/types/workout'

// Band hierarchy from X3 documentation
const BAND_HIERARCHY: Record<BandColor, number> = {
  'Ultra Light': 1,
  'White': 2,
  'Light Gray': 3,
  'Dark Gray': 4,
  'Black': 5,
  'Elite': 6
}

export class DataTransformer {
  /**
   * Format workout timestamp to user-friendly date string
   * Replaces duplicate formatting logic found in 15+ components
   */
  static formatWorkoutDate(timestamp: string): string {
    try {
      const dateStr = timestamp.split('T')[0]
      const parts = dateStr.split('-')
      
      if (parts.length === 3) {
        const year = parseInt(parts[0])
        const month = parseInt(parts[1])
        const day = parseInt(parts[2])
        return `${month}/${day}/${year}`
      }
      
      // Fallback to standard formatting
      return new Date(timestamp).toLocaleDateString()
    } catch (error) {
      console.error('Error formatting workout date:', error)
      return 'Invalid Date'
    }
  }

  /**
   * Calculate band strength ranking for PR calculations
   * Centralized band hierarchy logic used across 8 components
   */
  static calculateBandRank(bandColor: BandColor): number {
    return BAND_HIERARCHY[bandColor] || 0
  }

  /**
   * Get the strongest band from an array of band colors
   * Used for determining personal record rankings
   */
  static getHighestBand(bandColors: BandColor[]): BandColor | null {
    if (bandColors.length === 0) return null
    
    return bandColors.reduce((highest, current) => {
      return this.calculateBandRank(current) > this.calculateBandRank(highest) 
        ? current 
        : highest
    })
  }

  /**
   * Format exercise name with personal record for display
   * Consistent exercise display formatting throughout the application
   */
  static formatExerciseDisplay(
    exerciseName: string, 
    bestReps?: number, 
    bestBand?: BandColor
  ): string {
    const baseName = exerciseName.toUpperCase()
    
    if (bestReps && bestBand && bestReps > 0) {
      return `${baseName} (${bestReps})`
    }
    
    return baseName
  }

  /**
   * Format time duration in minutes and seconds
   * Used for rest timer and workout duration displays
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    
    return `${remainingSeconds}s`
  }

  /**
   * Calculate workout completion percentage
   * Used in progress displays and analytics
   */
  static calculateCompletionPercentage(completed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  /**
   * Format rep count display (full + partial reps)
   * Consistent rep display across exercise cards and history
   */
  static formatRepCount(fullReps: number, partialReps: number): string {
    if (partialReps > 0) {
      return `${fullReps}+${partialReps}`
    }
    return fullReps.toString()
  }

  /**
   * Parse and validate band color from string input
   * Ensures only valid band colors are used throughout the application
   */
  static parseBandColor(input: string): BandColor | null {
    const validBands = Object.keys(BAND_HIERARCHY) as BandColor[]
    const foundBand = validBands.find(band => 
      band.toLowerCase() === input.toLowerCase()
    )
    return foundBand || null
  }

  /**
   * Format workout summary for display
   * Used in workout history and progress tracking
   */
  static formatWorkoutSummary(
    workoutType: 'Push' | 'Pull',
    exerciseCount: number,
    date: string
  ): string {
    const formattedDate = this.formatWorkoutDate(date)
    return `${workoutType} workout - ${exerciseCount} exercises on ${formattedDate}`
  }

  /**
   * Calculate streak display text
   * Consistent streak formatting across dashboard and stats
   */
  static formatStreakDisplay(days: number): string {
    if (days === 0) return 'Start your streak!'
    if (days === 1) return '1 day streak'
    return `${days} day streak`
  }

  /**
   * Format weight progression display
   * For future weight tracking features
   */
  static formatWeightDisplay(weight: number, unit: 'lbs' | 'kg' = 'lbs'): string {
    return `${weight} ${unit}`
  }

  /**
   * Calculate band progression recommendation
   * Suggests when user should advance to next band
   */
  static getBandProgression(
    currentBand: BandColor,
    fullReps: number,
    targetReps: number = 15
  ): BandColor | null {
    if (fullReps < targetReps) return null
    
    const currentRank = this.calculateBandRank(currentBand)
    const bands = Object.keys(BAND_HIERARCHY) as BandColor[]
    const nextBand = bands.find(band => 
      this.calculateBandRank(band) === currentRank + 1
    )
    
    return nextBand || null
  }
}

/**
 * Export individual functions for tree-shaking in builds
 */
export const {
  formatWorkoutDate,
  calculateBandRank,
  getHighestBand,
  formatExerciseDisplay,
  formatDuration,
  calculateCompletionPercentage,
  formatRepCount,
  parseBandColor,
  formatWorkoutSummary,
  formatStreakDisplay,
  formatWeightDisplay,
  getBandProgression
} = DataTransformer