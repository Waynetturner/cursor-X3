import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export const X3_EXERCISES = {
  Push: ['Chest Press', 'Tricep Press', 'Overhead Press', 'Front Squat'],
  Pull: ['Deadlift', 'Bent Row', 'Bicep Curl', 'Calf Raise']
}

export const BAND_COLORS = ['Ultra Light', 'White', 'Light Gray', 'Dark Gray', 'Black', 'Elite']

// Calculate what workout should be today
export function getTodaysWorkout(startDate: string) {
  const start = new Date(startDate)
  // Use only the local date for today (ignores time and timezone)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  const week = Math.floor(daysSinceStart / 7) + 1
  const dayInWeek = daysSinceStart % 7
  
  // Week 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest
  // Week 5+: Push/Pull/Push/Pull/Push/Pull/Rest
  const schedule = week <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
  
  return {
    week,
    workoutType: schedule[dayInWeek] as 'Push' | 'Pull' | 'Rest',
    dayInWeek
  }
}

// Calculate workout for a specific date
export function getWorkoutForDate(startDate: string, targetDate: string) {
  const start = new Date(startDate)
  const target = new Date(targetDate)
  
  // Normalize both dates to avoid timezone issues
  start.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  
  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  // Handle negative days (before start date)
  if (daysSinceStart < 0) {
    return {
      week: 0,
      workoutType: 'Rest' as 'Push' | 'Pull' | 'Rest',
      dayInWeek: -1
    }
  }
  
  const week = Math.floor(daysSinceStart / 7) + 1
  const dayInWeek = daysSinceStart % 7
  
  // Week 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest
  // Week 5+: Push/Pull/Push/Pull/Push/Pull/Rest
  const schedule = week <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
  
  return {
    week,
    workoutType: schedule[dayInWeek] as 'Push' | 'Pull' | 'Rest',
    dayInWeek
  }
}

// Calculate streak including rest days (following Dr. Jaquish methodology)
export function calculateStreak(startDate: string, workoutDates: string[]) {
  const start = new Date(startDate)
  const today = new Date()
  
  // Normalize dates to avoid timezone issues
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  // If start date is in the future, return 0
  if (start > today) return 0
  
  const streakEndDate = new Date(today)
  let streakLength = 0
  
  // Work backwards from today to find where the streak breaks
  while (streakEndDate >= start) {
    const checkDateStr = streakEndDate.toISOString().split('T')[0]
    const scheduledWorkout = getWorkoutForDate(startDate, checkDateStr)
    
    let dayCompleted = false
    
    if (scheduledWorkout.workoutType === 'Rest') {
      // Rest days automatically count as completed (following schedule)
      dayCompleted = true
    } else {
      // Workout day - check if user has workout data for this date
      dayCompleted = workoutDates.includes(checkDateStr)
    }
    
    if (dayCompleted) {
      streakLength++
    } else {
      // Found a missed day, streak ends here
      break
    }
    
    // Go back one day
    streakEndDate.setDate(streakEndDate.getDate() - 1)
  }
  
  return streakLength
}

// Handle missed workouts following Dr. Jaquish methodology
export function handleMissedWorkouts(lastWorkoutDate: string) {
  const lastWorkout = new Date(lastWorkoutDate)
  const today = new Date()
  const daysMissed = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysMissed >= 8) {
    return {
      action: 'restart_prompt',
      message: 'Consider restarting your 12-week program for best results'
    }
  } else if (daysMissed >= 1) {
    return {
      action: 'continue_schedule', 
      message: 'Pick up where you left off - consistency is key!'
    }
  }
  
  return {
    action: 'continue',
    message: 'Great job staying on track!'
  }
}

// Calculate week progress (4 workouts weeks 1-4, 6 workouts week 5+)
export function calculateWeekProgress(startDate: string, workoutDates: string[]) {
  const todayWorkout = getTodaysWorkout(startDate)
  const currentWeek = todayWorkout.week
  
  // Get start of current week
  const startOfWeek = new Date(startDate)
  startOfWeek.setDate(startOfWeek.getDate() + (currentWeek - 1) * 7)
  
  // Get end of current week
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  
  // Count workouts in current week
  const currentWeekWorkouts = workoutDates.filter(date => {
    const workoutDate = new Date(date)
    return workoutDate >= startOfWeek && workoutDate <= endOfWeek
  }).length
  
  // Determine total workouts for this week
  const totalWorkoutsThisWeek = currentWeek <= 4 ? 4 : 6
  
  return {
    completed: currentWeekWorkouts,
    total: totalWorkoutsThisWeek,
    percentage: Math.round((currentWeekWorkouts / totalWorkoutsThisWeek) * 100)
  }
}

// ==========================================
// COMPLETION-BASED WORKOUT LOGIC
// ==========================================

/**
 * Get completed workout dates for a user
 * Returns array of dates where user completed at least one exercise
 */
export async function getCompletedWorkoutDates(userId: string): Promise<string[]> {
  try {
    const { data: exercises, error } = await supabase
      .from('workout_exercises')
      .select('workout_local_date_time')
      .eq('user_id', userId)
      .order('workout_local_date_time', { ascending: false })
    
    if (error) {
      console.error('Error fetching completed workout dates:', error)
      return []
    }
    
    if (!exercises) return []
    
    // Extract unique dates from workout timestamps
    const uniqueDates = [...new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))]
    
    console.log('📅 Completed workout dates found:', uniqueDates.length)
    return uniqueDates
  } catch (error) {
    console.error('Error in getCompletedWorkoutDates:', error)
    return []
  }
}

/**
 * Determine workout completion status for a specific date
 * Returns completion status: 'complete', 'partial', 'missed', 'scheduled'
 */
export async function determineWorkoutCompletionStatus(
  workoutDate: string, 
  userId: string, 
  workoutType: 'Push' | 'Pull'
): Promise<'complete' | 'partial' | 'missed' | 'scheduled'> {
  try {
    // Get exercises for this specific date and workout type
    const { data: exercises, error } = await supabase
      .from('workout_exercises')
      .select('exercise_name')
      .eq('user_id', userId)
      .eq('workout_type', workoutType)
      .gte('workout_local_date_time', `${workoutDate}T00:00:00`)
      .lt('workout_local_date_time', `${workoutDate}T23:59:59`)
    
    if (error) {
      console.error('Error checking workout completion:', error)
      return 'scheduled'
    }
    
    if (!exercises || exercises.length === 0) {
      // Check if this date is in the past
      const today = new Date().toISOString().split('T')[0]
      return workoutDate < today ? 'missed' : 'scheduled'
    }
    
    // Count unique exercises completed
    const uniqueExercises = [...new Set(exercises.map(e => e.exercise_name))]
    const expectedExercises = X3_EXERCISES[workoutType]
    
    if (uniqueExercises.length >= expectedExercises.length) {
      return 'complete'
    } else if (uniqueExercises.length > 0) {
      return 'partial'
    } else {
      return 'missed'
    }
  } catch (error) {
    console.error('Error in determineWorkoutCompletionStatus:', error)
    return 'scheduled'
  }
}

/**
 * Get today's workout using completion-based progression
 * Users must complete current workout before advancing to next
 */

// REMOVED: getTodaysWorkoutWithCompletion function
// This function contained hardcoded Week 10/11 logic that conflicted with the dynamic
// daily_workout_log system. Replaced by getTodaysWorkoutFromLog in daily-workout-log.ts

          


/**
 * Get workout completion history for a user
 * Returns comprehensive timeline of completed/missed/scheduled workouts
 */
export async function getWorkoutCompletionHistory(
  userId: string, 
  startDate: string
): Promise<Array<{
  date: string
  scheduledWorkout: 'Push' | 'Pull' | 'Rest'
  status: 'complete' | 'partial' | 'missed' | 'scheduled'
  week: number
  dayInWeek: number
}>> {
  try {
    const completedDates = await getCompletedWorkoutDates(userId)
    
    const start = new Date(startDate)
    const today = new Date()
    start.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    
    const history = []
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let day = 0; day <= daysSinceStart; day++) {
      const checkDate = new Date(start)
      checkDate.setDate(start.getDate() + day)
      const checkDateStr = checkDate.toISOString().split('T')[0]
      
      const week = Math.floor(day / 7) + 1
      const dayOfWeek = day % 7
      const schedule = week <= 4 
        ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
        : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
      
      const scheduledWorkout = schedule[dayOfWeek]
      
      let status: 'complete' | 'partial' | 'missed' | 'scheduled'
      
      if (scheduledWorkout === 'Rest') {
        status = 'complete' // Rest days auto-complete
      } else {
        const wasCompleted = completedDates.includes(checkDateStr)
        if (wasCompleted) {
          // Check if it was a full completion
          const completionStatus = await determineWorkoutCompletionStatus(
            checkDateStr, 
            userId, 
            scheduledWorkout as 'Push' | 'Pull'
          )
          status = completionStatus
        } else {
          status = checkDateStr < today.toISOString().split('T')[0] ? 'missed' : 'scheduled'
        }
      }
      
      history.push({
        date: checkDateStr,
        scheduledWorkout,
        status,
        week,
        dayInWeek: dayOfWeek
      })
    }
    
    return history
  } catch (error) {
    console.error('Error in getWorkoutCompletionHistory:', error)
    return []
  }
}

/**
 * Calculate streak using completion-based logic
 * Enhanced version that considers actual workout completions
 */
export async function calculateStreakWithCompletion(
  startDate: string, 
  userId: string
): Promise<number> {
  try {
    const history = await getWorkoutCompletionHistory(userId, startDate)
    
    if (history.length === 0) return 0
    
    // Work backwards from today to find where streak breaks
    let streakLength = 0
    
    for (let i = history.length - 1; i >= 0; i--) {
      const day = history[i]
      
      if (day.status === 'complete') {
        streakLength++
      } else if (day.status === 'missed') {
        // Streak broken by missed workout
        break
      }
      // Scheduled workouts don't break streak (haven't been missed yet)
    }
    
    console.log('🔥 Completion-based streak:', streakLength)
    return streakLength
    
  } catch (error) {
    console.error('Error in calculateStreakWithCompletion:', error)
    // Fallback to calendar-based streak
    const completedDates = await getCompletedWorkoutDates(userId)
    return calculateStreak(startDate, completedDates)
  }
}

/**
 * Get workout information for calendar display with dynamic shifting
 * Shows actual completion status for past dates and shifted schedule for future dates
 */
export async function getWorkoutForDateWithCompletion(
  targetDate: string,
  userId: string,
  startDate: string
): Promise<{
  originalWorkout: 'Push' | 'Pull' | 'Rest'
  actualWorkout: 'Push' | 'Pull' | 'Rest' | 'Missed'
  status: 'complete' | 'partial' | 'missed' | 'scheduled'
  week: number
  dayInWeek: number
  isShifted: boolean
}> {
  try {
    // Get the original calendar-based workout for this date
    const originalWorkout = getWorkoutForDate(startDate, targetDate)
    
    // Get current completion status to understand where user is in sequence
    // Import the daily workout log function at the top of the file if needed
    const { getTodaysWorkoutFromLog, ensureTodaysEntry } = await import('./daily-workout-log')
    await ensureTodaysEntry(userId)
    const todaysWorkout = await getTodaysWorkoutFromLog(userId)
    
    const currentWorkout = {
      week: todaysWorkout?.week || 1,
      workoutType: todaysWorkout?.workoutType || 'Push' as 'Push' | 'Pull' | 'Rest',
      dayInWeek: todaysWorkout?.dayInWeek || 0,
      status: 'scheduled' as 'current' | 'catch_up' | 'scheduled',
      missedWorkouts: 0
    }
    
    const today = (() => {
      const now = new Date();
      // Use local date to match calendar component's date calculation
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
      const day = now.getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    })()
    
    const targetDateObj = new Date(targetDate)
    const todayObj = new Date(today)
    
    
    // For past dates, show actual completion status
    if (targetDate < today) {
      if (originalWorkout.workoutType === 'Rest') {
        return {
          originalWorkout: originalWorkout.workoutType,
          actualWorkout: 'Rest',
          status: 'complete',
          week: originalWorkout.week,
          dayInWeek: originalWorkout.dayInWeek,
          isShifted: false
        }
      } else {
        // Check if this workout was actually completed
        const completionStatus = await determineWorkoutCompletionStatus(
          targetDate, 
          userId, 
          originalWorkout.workoutType as 'Push' | 'Pull'
        )
        
        return {
          originalWorkout: originalWorkout.workoutType,
          actualWorkout: completionStatus === 'complete' || completionStatus === 'partial' 
            ? originalWorkout.workoutType 
            : 'Missed',
          status: completionStatus,
          week: originalWorkout.week,
          dayInWeek: originalWorkout.dayInWeek,
          isShifted: false
        }
      }
    }
    
    // For today and future dates, show shifted schedule based on actual completion
    else {
      // For today, show what workout is actually needed (could be catch up)
      if (targetDate === today) {
        return {
          originalWorkout: originalWorkout.workoutType,
          actualWorkout: currentWorkout.workoutType,
          status: currentWorkout.status === 'catch_up' ? 'scheduled' : 'scheduled',
          week: originalWorkout.week,
          dayInWeek: originalWorkout.dayInWeek,
          isShifted: originalWorkout.workoutType !== currentWorkout.workoutType
        }
      }
      
      // but we need to calculate it correctly based on the completion sequence
      
      const daysDifference = Math.floor((targetDateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24))
      
      const currentWorkoutDay = currentWorkout.dayInWeek
      
      
      // Project forward day by day, following the X3 schedule pattern
      let projectedDay = currentWorkoutDay
      for (let i = 0; i < daysDifference; i++) {
        projectedDay = (projectedDay + 1) % 7
      }
      
      
      // Use the original target date's week to determine schedule pattern
      const originalTargetWeek = originalWorkout.week
      const schedule = originalTargetWeek <= 4 
        ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
        : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
      
      // Get the workout type for this projected day
      const projectedWorkout = schedule[projectedDay]
      
      
      // Check if this represents a shift from the original schedule
      const isShifted = originalWorkout.workoutType !== projectedWorkout
      
      return {
        originalWorkout: originalWorkout.workoutType,
        actualWorkout: projectedWorkout,
        status: 'scheduled',
        week: originalTargetWeek,
        dayInWeek: projectedDay,
        isShifted
      }
    }
    
  } catch (error) {
    console.error('🚨 ERROR in getWorkoutForDateWithCompletion for date', targetDate, ':', error)
    console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace available')
    // Fallback to original calendar logic
    const original = getWorkoutForDate(startDate, targetDate)
    console.log('🔄 Using fallback logic for', targetDate, ':', original)
    return {
      originalWorkout: original.workoutType,
      actualWorkout: original.workoutType,
      status: 'scheduled' as const,
      week: original.week,
      dayInWeek: original.dayInWeek,
      isShifted: false
    }
  }
}
