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
  
  let streakEndDate = new Date(today)
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

// Calculate workout for a specific date with completion-based adaptive scheduling
export function getWorkoutForDateWithCompletion(startDate: string, targetDate: string, completedWorkouts: Set<string>) {
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
      dayInWeek: -1,
      status: 'future' as 'completed' | 'missed' | 'future'
    }
  }
  
  const targetDateStr = target.toISOString().split('T')[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isPastDate = target < today
  
  if (isPastDate) {
    const staticWorkout = getWorkoutForDate(startDate, targetDateStr)
    const isCompleted = completedWorkouts.has(targetDateStr)
    
    return {
      ...staticWorkout,
      status: isCompleted ? 'completed' as const : 'missed' as const
    }
  }
  
  let completedWorkoutDays = 0
  let currentCheckDate = new Date(start)
  
  while (currentCheckDate < target) {
    const checkDateStr = currentCheckDate.toISOString().split('T')[0]
    const scheduledWorkout = getWorkoutForDate(startDate, checkDateStr)
    
    if (scheduledWorkout.workoutType !== 'Rest' && completedWorkouts.has(checkDateStr)) {
      completedWorkoutDays++
    }
    
    currentCheckDate.setDate(currentCheckDate.getDate() + 1)
  }
  
  const workoutSequence: ('Push' | 'Pull' | 'Rest')[] = []
  
  // Week 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest (4 workouts per week)
  // Week 5+: Push/Pull/Push/Pull/Push/Pull/Rest (6 workouts per week)
  for (let week = 1; week <= 20; week++) { // Generate enough weeks
    if (week <= 4) {
      workoutSequence.push('Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest')
    } else {
      workoutSequence.push('Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest')
    }
  }
  
  let workoutIndex = 0
  let workoutDaysProcessed = 0
  
  while (workoutDaysProcessed < completedWorkoutDays && workoutIndex < workoutSequence.length) {
    if (workoutSequence[workoutIndex] !== 'Rest') {
      workoutDaysProcessed++
    }
    if (workoutDaysProcessed < completedWorkoutDays) {
      workoutIndex++
    }
  }
  
  if (workoutDaysProcessed === completedWorkoutDays && workoutIndex < workoutSequence.length) {
    workoutIndex++
    while (workoutIndex < workoutSequence.length && workoutSequence[workoutIndex] === 'Rest') {
      workoutIndex++
    }
  }
  
  // Determine what workout should happen on the target date
  let projectedWorkoutType: 'Push' | 'Pull' | 'Rest' = 'Rest'
  
  if (workoutIndex < workoutSequence.length) {
    projectedWorkoutType = workoutSequence[workoutIndex]
  } else {
    const remainingIndex = workoutIndex % 7
    const week5Pattern: ('Push' | 'Pull' | 'Rest')[] = ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest']
    projectedWorkoutType = week5Pattern[remainingIndex]
  }
  
  // Calculate which week we're in based on the target date
  const week = Math.floor(daysSinceStart / 7) + 1
  const dayInWeek = daysSinceStart % 7
  
  return {
    week,
    workoutType: projectedWorkoutType,
    dayInWeek,
    status: 'future' as const
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
