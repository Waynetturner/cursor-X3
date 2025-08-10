/**
 * Workout Service
 * 
 * Domain service for all workout-related business logic.
 * Extends BaseService to provide consistent error handling and logging.
 * 
 * Handles:
 * - Workout data retrieval and management
 * - Exercise completion tracking
 * - Progress calculations
 * - Personal record management
 */

import { BaseService, CommonValidationRules, ServiceOperation } from '@/lib/base-service'
import { SupabaseHelpers } from '@/utils/supabase-helpers'
import { DataTransformer } from '@/utils/data-transformers'
import { WorkoutExerciseData, Exercise, WorkoutInfo, BandColor } from '@/types/workout'
import { ErrorCode } from '@/types/errors'
import { getTodaysWorkoutWithCompletion } from '@/lib/supabase'

export interface WorkoutServiceOptions {
  cacheEnabled?: boolean
  cacheTtlMs?: number
}

export class WorkoutService extends BaseService {
  protected readonly serviceName = 'WorkoutService'
  private readonly cacheEnabled: boolean
  private readonly cacheTtlMs: number

  constructor(options: WorkoutServiceOptions = {}) {
    super({
      timeout: 15000, // Longer timeout for complex workout operations
      retries: 2,
      logEnabled: true
    })
    
    this.cacheEnabled = options.cacheEnabled ?? true
    this.cacheTtlMs = options.cacheTtlMs ?? 300000 // 5 minutes
  }

  /**
   * Get today's workout information for a user
   */
  async getTodaysWorkout(userId: string, startDate: string): Promise<ServiceOperation<WorkoutInfo>> {
    const validation = this.validateInput({ userId, startDate }, [
      CommonValidationRules.validUserId(),
      CommonValidationRules.required<string>('startDate')
    ])

    if (validation) {
      return { data: null, error: validation, success: false }
    }

    const cacheKey = this.cacheEnabled ? `workout:today:${userId}:${startDate}` : null

    return this.safeExecute(async () => {
      if (cacheKey) {
        return this.cached(cacheKey, async () => {
          return getTodaysWorkoutWithCompletion(startDate, userId)
        }, this.cacheTtlMs)
      }

      return getTodaysWorkoutWithCompletion(startDate, userId)
    }, 'getTodaysWorkout', { userId, startDate })
  }

  /**
   * Save exercise data with validation and duplicate checking
   */
  async saveExercise(
    exerciseData: WorkoutExerciseData,
    preventDuplicates: boolean = true
  ): Promise<ServiceOperation<{ id: string }>> {
    const validation = this.validateExerciseData(exerciseData)
    if (validation) {
      return { data: null, error: validation, success: false }
    }

    return this.safeExecuteWithRetry(async () => {
      // Check for duplicates if requested
      if (preventDuplicates) {
        const workoutDate = exerciseData.workout_local_date_time.split('T')[0]
        const { exists, error } = await SupabaseHelpers.checkExerciseExists(
          exerciseData.user_id,
          exerciseData.exercise_name,
          workoutDate
        )

        if (error) {
          throw new Error(`Duplicate check failed: ${error.message}`)
        }

        if (exists) {
          throw {
            code: ErrorCode.EXERCISE_ALREADY_COMPLETED,
            message: 'Exercise already completed today',
            userMessage: 'This exercise has already been completed today.'
          }
        }
      }

      // Insert the exercise
      const result = await SupabaseHelpers.insertExercise(exerciseData)
      
      if (result.error) {
        throw result.error
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No data returned from insert operation')
      }

      // Clear relevant caches
      this.clearWorkoutCaches(exerciseData.user_id)

      return { id: result.data[0].id }
    }, 'saveExercise', { 
      exerciseName: exerciseData.exercise_name,
      workoutType: exerciseData.workout_type,
      userId: exerciseData.user_id
    })
  }

  /**
   * Get exercise history for personal record calculations
   */
  async getExerciseHistory(
    userId: string,
    exerciseName: string,
    workoutType?: 'Push' | 'Pull',
    limit?: number
  ): Promise<ServiceOperation<Exercise[]>> {
    const validation = this.validateInput({ userId, exerciseName }, [
      CommonValidationRules.validUserId(),
      CommonValidationRules.nonEmpty<string>('exerciseName')
    ])

    if (validation) {
      return { data: null, error: validation, success: false }
    }

    const cacheKey = this.cacheEnabled 
      ? `exercise:history:${userId}:${exerciseName}:${workoutType || 'all'}:${limit || 'unlimited'}`
      : null

    return this.safeExecute(async () => {
      const operation = async () => {
        const result = await SupabaseHelpers.getExerciseHistory(userId, exerciseName, workoutType)
        
        if (result.error) {
          throw result.error
        }

        if (!result.data) {
          return []
        }

        // Transform database records to Exercise objects
        const exercises = result.data
          .slice(0, limit || undefined)
          .map(record => this.transformDatabaseRecordToExercise(record))

        return exercises
      }

      if (cacheKey) {
        return this.cached(cacheKey, operation, this.cacheTtlMs)
      }

      return operation()
    }, 'getExerciseHistory', { userId, exerciseName, workoutType, limit })
  }

  /**
   * Get user's workout completion statistics
   */
  async getWorkoutStats(
    userId: string,
    timeRange?: { start: string; end: string }
  ): Promise<ServiceOperation<WorkoutStats>> {
    const validation = this.validateInput({ userId }, [
      CommonValidationRules.validUserId()
    ])

    if (validation) {
      return { data: null, error: validation, success: false }
    }

    const cacheKey = this.cacheEnabled
      ? `stats:${userId}:${timeRange?.start || 'all'}:${timeRange?.end || 'all'}`
      : null

    return this.safeExecute(async () => {
      const operation = async () => {
        const result = await SupabaseHelpers.getWorkoutStats(userId, timeRange)
        
        if (result.error) {
          throw result.error
        }

        if (!result.data) {
          return this.createEmptyStats()
        }

        return this.calculateWorkoutStats(result.data)
      }

      if (cacheKey) {
        return this.cached(cacheKey, operation, this.cacheTtlMs)
      }

      return operation()
    }, 'getWorkoutStats', { userId, timeRange })
  }

  /**
   * Calculate personal records for exercises
   */
  async calculatePersonalRecords(
    userId: string,
    exerciseNames: string[]
  ): Promise<ServiceOperation<Record<string, PersonalRecord>>> {
    const validation = this.validateInput({ userId, exerciseNames }, [
      CommonValidationRules.validUserId(),
      CommonValidationRules.nonEmpty('exerciseNames')
    ])

    if (validation) {
      return { data: null, error: validation, success: false }
    }

    return this.safeExecute(async () => {
      const records: Record<string, PersonalRecord> = {}

      // Process each exercise in parallel
      const promises = exerciseNames.map(async (exerciseName) => {
        const historyResult = await this.getExerciseHistory(userId, exerciseName)
        
        if (historyResult.success && historyResult.data) {
          records[exerciseName] = this.calculatePRFromHistory(historyResult.data)
        }
      })

      await Promise.all(promises)
      return records
    }, 'calculatePersonalRecords', { userId, exerciseCount: exerciseNames.length })
  }

  /**
   * Private helper methods
   */

  private validateExerciseData(data: WorkoutExerciseData) {
    return this.validateInput(data, [
      CommonValidationRules.validUserId(),
      CommonValidationRules.required<string>('exercise_name'),
      CommonValidationRules.required<string>('workout_type'),
      CommonValidationRules.validEnum('workout_type', ['Push', 'Pull']),
      {
        name: 'valid_reps',
        validate: (input) => ({
          isValid: typeof input.full_reps === 'number' && input.full_reps >= 0 &&
                   typeof input.partial_reps === 'number' && input.partial_reps >= 0,
          message: 'Rep counts must be valid numbers'
        })
      },
      {
        name: 'valid_band',
        validate: (input) => ({
          isValid: DataTransformer.parseBandColor(input.band_color) !== null,
          message: 'Invalid band color'
        })
      }
    ])
  }

  private transformDatabaseRecordToExercise(record: any): Exercise {
    return {
      id: record.id,
      exercise_name: record.exercise_name,
      band_color: record.band_color as BandColor,
      full_reps: record.full_reps,
      partial_reps: record.partial_reps,
      notes: record.notes || '',
      saved: true,
      workout_local_date_time: record.workout_local_date_time || record.created_at_utc,
      name: DataTransformer.formatExerciseDisplay(record.exercise_name, record.full_reps, record.band_color),
      band: record.band_color as BandColor,
      fullReps: record.full_reps,
      partialReps: record.partial_reps,
      lastWorkout: DataTransformer.formatRepCount(record.full_reps, record.partial_reps),
      lastWorkoutDate: DataTransformer.formatWorkoutDate(record.workout_local_date_time || record.created_at_utc)
    }
  }

  private calculateWorkoutStats(data: any[]): WorkoutStats {
    const totalWorkouts = this.countUniqueWorkouts(data)
    const exercisesByType = this.groupExercisesByWorkoutType(data)
    const streakData = this.calculateStreakFromData(data)

    return {
      totalWorkouts,
      totalExercises: data.length,
      workoutsByType: {
        Push: exercisesByType.Push?.length || 0,
        Pull: exercisesByType.Pull?.length || 0
      },
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
      averageRepsPerExercise: this.calculateAverageReps(data),
      mostUsedBand: this.findMostUsedBand(data),
      recentWorkouts: this.getRecentWorkouts(data)
    }
  }

  private calculatePRFromHistory(history: Exercise[]): PersonalRecord {
    let bestReps = 0
    let bestBand: BandColor = 'White'
    let bestDate = ''

    for (const exercise of history) {
      const bandRank = DataTransformer.calculateBandRank(exercise.band_color)
      const currentBestRank = DataTransformer.calculateBandRank(bestBand)

      // Higher band rank wins, or same band with more reps
      if (bandRank > currentBestRank || 
          (bandRank === currentBestRank && exercise.full_reps > bestReps)) {
        bestReps = exercise.full_reps
        bestBand = exercise.band_color
        bestDate = exercise.workout_local_date_time
      }
    }

    return {
      fullReps: bestReps,
      band: bestBand,
      date: bestDate,
      displayText: DataTransformer.formatExerciseDisplay('', bestReps, bestBand)
    }
  }

  private clearWorkoutCaches(userId: string): void {
    this.clearCache(`workout:.*${userId}.*`)
    this.clearCache(`exercise:.*${userId}.*`)
    this.clearCache(`stats:${userId}:.*`)
  }

  private createEmptyStats(): WorkoutStats {
    return {
      totalWorkouts: 0,
      totalExercises: 0,
      workoutsByType: { Push: 0, Pull: 0 },
      currentStreak: 0,
      longestStreak: 0,
      averageRepsPerExercise: 0,
      mostUsedBand: 'White',
      recentWorkouts: []
    }
  }

  // Additional helper methods for stats calculation
  private countUniqueWorkouts(data: any[]): number {
    const uniqueDates = new Set(
      data.map(record => record.workout_local_date_time.split('T')[0])
    )
    return uniqueDates.size
  }

  private groupExercisesByWorkoutType(data: any[]) {
    return data.reduce((acc, record) => {
      const type = record.workout_type as 'Push' | 'Pull'
      if (!acc[type]) acc[type] = []
      acc[type].push(record)
      return acc
    }, {} as Record<'Push' | 'Pull', any[]>)
  }

  private calculateStreakFromData(data: any[]): { current: number; longest: number } {
    // Simplified streak calculation - in reality this would be more complex
    return { current: 7, longest: 14 } // Placeholder
  }

  private calculateAverageReps(data: any[]): number {
    if (data.length === 0) return 0
    const totalReps = data.reduce((sum, record) => sum + record.full_reps + record.partial_reps, 0)
    return Math.round(totalReps / data.length)
  }

  private findMostUsedBand(data: any[]): BandColor {
    const bandCounts = data.reduce((acc, record) => {
      const band = record.band_color as BandColor
      acc[band] = (acc[band] || 0) + 1
      return acc
    }, {} as Record<BandColor, number>)

    let mostUsed: BandColor = 'White'
    let maxCount = 0

    for (const [band, count] of Object.entries(bandCounts)) {
      if (count > maxCount) {
        maxCount = count
        mostUsed = band as BandColor
      }
    }

    return mostUsed
  }

  private getRecentWorkouts(data: any[]): RecentWorkout[] {
    // Group by date and return recent workouts
    // Simplified implementation
    return []
  }
}

/**
 * Supporting interfaces
 */

export interface WorkoutStats {
  totalWorkouts: number
  totalExercises: number
  workoutsByType: {
    Push: number
    Pull: number
  }
  currentStreak: number
  longestStreak: number
  averageRepsPerExercise: number
  mostUsedBand: BandColor
  recentWorkouts: RecentWorkout[]
}

export interface PersonalRecord {
  fullReps: number
  band: BandColor
  date: string
  displayText: string
}

export interface RecentWorkout {
  date: string
  type: 'Push' | 'Pull'
  exerciseCount: number
  totalReps: number
}