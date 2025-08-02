import { supabase } from './supabase'
import { 
  getTodaysWorkoutWithCompletion, 
  calculateStreakWithCompletion,
  getCompletedWorkoutDates,
  getWorkoutForDate
} from './supabase'

export interface UserStats {
  // Core workout data
  totalWorkouts: number
  currentWeek: number
  currentStreak: number
  longestStreak: number
  
  // Completion status
  workoutStatus: {
    week: number
    workoutType: 'Push' | 'Pull' | 'Rest'
    dayInWeek: number
    status: 'current' | 'catch_up' | 'scheduled'
    missedWorkouts: number
  }
  
  // Additional stats
  totalExercises: number
  completedThisWeek: number
  averageRepsPerExercise: number
  mostUsedBand: string
  workoutsByType: {
    Push: number
    Pull: number
  }
  
  // Dates and timing
  startDate: string | null
  lastWorkoutDate: string | null
}

/**
 * Get comprehensive user statistics from a single source of truth
 * This ensures all pages show consistent data
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    console.log('📊 Getting unified user stats for:', userId)
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('x3_start_date')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile?.x3_start_date) {
      console.error('❌ Error fetching profile:', profileError)
      return null
    }
    
    const startDate = profile.x3_start_date
    
    // Get all workout exercises for this user
    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', userId)
      .order('workout_local_date_time', { ascending: false })
    
    if (exercisesError) {
      console.error('❌ Error fetching exercises:', exercisesError)
      return null
    }
    
    if (!exercises || exercises.length === 0) {
      // No workouts yet - return default stats
      const workoutStatus = await getTodaysWorkoutWithCompletion(startDate, userId)
      
      return {
        totalWorkouts: 0,
        currentWeek: workoutStatus.week,
        currentStreak: 0,
        longestStreak: 0,
        workoutStatus,
        totalExercises: 0,
        completedThisWeek: 0,
        averageRepsPerExercise: 0,
        mostUsedBand: 'White',
        workoutsByType: { Push: 0, Pull: 0 },
        startDate,
        lastWorkoutDate: null
      }
    }
    
    // Calculate completion-based statistics
    const workoutStatus = await getTodaysWorkoutWithCompletion(startDate, userId)
    
    // Get unique workout dates (total workouts)
    const workoutDates = [...new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))]
    const totalWorkouts = workoutDates.length
    
    // Calculate actual calendar-based current week (not affected by missed workouts)
    const start = new Date(startDate)
    const today = new Date()
    start.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const actualCurrentWeek = Math.floor(daysSinceStart / 7) + 1
    
    // Calculate streaks using completion-based logic
    const currentStreak = await calculateStreakWithCompletion(startDate, userId)
    
    // Calculate longest streak from historical data
    const longestStreak = await calculateLongestStreakFromHistory(startDate, userId)
    
    // Calculate current week workouts using actual calendar week
    const completedThisWeek = await calculateCurrentWeekWorkouts(startDate, userId, actualCurrentWeek)
    
    // Band usage statistics
    const bandCounts = exercises.reduce((acc: Record<string, number>, ex) => {
      acc[ex.band_color] = (acc[ex.band_color] || 0) + 1
      return acc
    }, {})
    const mostUsedBand = Object.keys(bandCounts).length > 0 
      ? Object.keys(bandCounts).reduce((a, b) => bandCounts[a] > bandCounts[b] ? a : b)
      : 'White'
    
    // Workout type distribution
    const workoutsByType = exercises.reduce((acc: { Push: number; Pull: number }, ex) => {
      if (ex.workout_type === 'Push') {
        acc.Push = (acc.Push || 0) + 1
      } else if (ex.workout_type === 'Pull') {
        acc.Pull = (acc.Pull || 0) + 1
      }
      return acc
    }, { Push: 0, Pull: 0 })
    
    // Average reps calculation
    const totalReps = exercises.reduce((sum, ex) => sum + (ex.full_reps || 0) + (ex.partial_reps || 0), 0)
    const averageRepsPerExercise = exercises.length > 0 ? Math.round(totalReps / exercises.length) : 0
    
    // Last workout date
    const lastWorkoutDate = workoutDates.length > 0 ? workoutDates[0] : null
    
    const stats: UserStats = {
      totalWorkouts,
      currentWeek: actualCurrentWeek, // Use calendar-based week, not completion-based
      currentStreak,
      longestStreak,
      workoutStatus,
      totalExercises: exercises.length,
      completedThisWeek,
      averageRepsPerExercise,
      mostUsedBand,
      workoutsByType,
      startDate,
      lastWorkoutDate
    }
    
    console.log('✅ Unified user stats calculated:', stats)
    return stats
    
  } catch (error) {
    console.error('❌ Error calculating user stats:', error)
    return null
  }
}

/**
 * Calculate longest streak from historical completion data
 * Uses flexible approach - looks for periods of consistent workout activity following X3 principles
 * A streak continues as long as you're working out regularly (max 2 day gaps)
 */
async function calculateLongestStreakFromHistory(startDate: string, userId: string): Promise<number> {
  try {
    // Get all completed workout dates
    const completedDates = await getCompletedWorkoutDates(userId)
    
    console.log('🔍 Calculating longest streak - completed dates:', completedDates.length)
    console.log('📅 First few completed dates:', completedDates.slice(0, 5))
    
    if (completedDates.length === 0) return 0
    
    // Sort dates to ensure chronological order
    const sortedDates = completedDates.sort()
    console.log('📊 Date range:', sortedDates[0], 'to', sortedDates[sortedDates.length - 1])
    
    let longestStreak = 0
    let currentStreak = 0
    let longestStreakStart = ''
    let longestStreakEnd = ''
    let currentStreakStart = ''
    
    // Convert dates to chronological timeline with gaps
    const start = new Date(startDate)
    const today = new Date()
    start.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    // Go through each day and track workout activity
    for (let day = 0; day <= daysSinceStart; day++) {
      const checkDate = new Date(start)
      checkDate.setDate(start.getDate() + day)
      const checkDateStr = checkDate.toISOString().split('T')[0]
      
      // Use the same working logic as the calendar
      const workout = getWorkoutForDate(startDate, checkDateStr)
      const scheduledWorkout = workout.workoutType
      
      let dayCompleted = false
      
      if (scheduledWorkout === 'Rest') {
        // Rest days automatically count as completed (following X3 schedule)
        dayCompleted = true
      } else {
        // Check if workout was completed
        dayCompleted = completedDates.includes(checkDateStr)
      }
      
      if (dayCompleted) {
        // Continue or start streak
        if (currentStreak === 0) {
          currentStreakStart = checkDateStr
        }
        currentStreak++
        
        // Track the longest streak seen so far
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
          longestStreakStart = currentStreakStart
          longestStreakEnd = checkDateStr
        }
      } else {
        // Missed workout breaks the streak, reset current streak
        if (currentStreak > 0) {
          console.log(`💔 Streak broken on ${checkDateStr} (missed ${scheduledWorkout}), streak was ${currentStreak} days`)
        }
        currentStreak = 0
        currentStreakStart = ''
      }
    }
    
    console.log('🏆 Longest streak found:', longestStreak, 'days')
    console.log('📅 Longest streak period:', longestStreakStart, 'to', longestStreakEnd)
    console.log('🔥 Current streak at end:', currentStreak, 'days')
    
    return longestStreak
    
  } catch (error) {
    console.error('❌ Error calculating longest streak:', error)
    return 0
  }
}

/**
 * Calculate workouts completed in current week
 */
async function calculateCurrentWeekWorkouts(startDate: string, userId: string, currentWeek: number): Promise<number> {
  try {
    // Get start date of current week
    const start = new Date(startDate)
    const weekStartDay = (currentWeek - 1) * 7
    const weekStart = new Date(start)
    weekStart.setDate(start.getDate() + weekStartDay)
    
    // Get end date of current week
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    // Get workouts in this week
    const { data: exercises, error } = await supabase
      .from('workout_exercises')
      .select('workout_local_date_time')
      .eq('user_id', userId)
      .gte('workout_local_date_time', weekStart.toISOString().split('T')[0] + 'T00:00:00')
      .lte('workout_local_date_time', weekEnd.toISOString().split('T')[0] + 'T23:59:59')
    
    if (error || !exercises) {
      console.error('❌ Error fetching current week workouts:', error)
      return 0
    }
    
    // Count unique workout dates
    const uniqueDates = new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))
    return uniqueDates.size
    
  } catch (error) {
    console.error('❌ Error calculating current week workouts:', error)
    return 0
  }
}

/**
 * Get streak information with proper context
 */
export function getStreakContext(currentStreak: number, longestStreak: number, currentWeek: number): {
  currentDescription: string
  longestDescription: string
  scheduleInfo: string
} {
  const scheduleInfo = currentWeek <= 4 
    ? 'Weeks 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest'
    : 'Weeks 5+: Push/Pull/Push/Pull/Push/Pull/Rest'
  
  const currentDescription = currentStreak === 0 
    ? 'No current streak - missed a scheduled workout'
    : `${currentStreak} consecutive days following the X3 schedule`
  
  const longestDescription = longestStreak === 0
    ? 'No streaks yet - keep going!'
    : `${longestStreak} consecutive days following the X3 schedule`
  
  return {
    currentDescription,
    longestDescription,
    scheduleInfo
  }
}
