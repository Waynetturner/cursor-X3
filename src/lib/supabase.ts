import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export const X3_EXERCISES = {
  Push: ['Chest Press', 'Tricep Press', 'Overhead Press', 'Front Squat'],
  Pull: ['Deadlift', 'Bent Row', 'Bicep Curl', 'Calf Raise']
}

export const BAND_COLORS = ['Ultra Light', 'White', 'Light Gray', 'Dark Gray', 'Black', 'Elite']

/**
 * COMPLETION-BASED TODAY'S WORKOUT CALCULATION
 * 
 * This function determines today's workout using completion-based progression where:
 * 1. Weeks only advance when ALL 7 workouts are completed (Push/Pull/Push/Pull/Push/Pull/Rest)
 * 2. Consecutive weeks do NOT begin until the previous week is fully completed
 * 3. Missed workouts prevent week advancement until caught up
 * 
 * CRITICAL: This logic must NOT use calendar-based week calculations for progression
 * Week boundaries are determined by workout completion sequences, not calendar days
 */
export function getTodaysWorkout(startDate: string, completedWorkouts?: Set<string>) {
  // Use consistent date parsing to avoid timezone issues
  const start = new Date(startDate + 'T00:00:00.000Z')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  today.setHours(0, 0, 0, 0)
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  if (!completedWorkouts) {
    const week = Math.floor(daysSinceStart / 7) + 1
    const dayInWeek = daysSinceStart % 7
    
    const schedule = week <= 4 
      ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
      : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
    
    return {
      week,
      workoutType: schedule[dayInWeek] as 'Push' | 'Pull' | 'Rest',
      dayInWeek
    }
  }
  
  // COMPLETION-BASED WEEK CALCULATION
  // Week progression is based on actual workout completions, not calendar days
  let actualCurrentWeek = 1
  let completedWorkoutsInCurrentWeek = 0
  
  // Count completed weeks by tracking workout sequences
  const completedDatesArray = Array.from(completedWorkouts)
  
  for (let day = 0; day < daysSinceStart; day++) {
    const checkDate = new Date(start.getTime() + (day * 24 * 60 * 60 * 1000))
    const checkDateStr = checkDate.toISOString().split('T')[0]
    
    const calendarWeek = Math.floor(day / 7) + 1
    const schedule = calendarWeek <= 4 
      ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
      : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
    
    const scheduledWorkout = schedule[day % 7]
    const wasCompleted = completedDatesArray.includes(checkDateStr)
    
    if (wasCompleted || scheduledWorkout === 'Rest') {
      completedWorkoutsInCurrentWeek++
      
      // Check if we completed a full week (7 workouts)
      if (completedWorkoutsInCurrentWeek === 7) {
        actualCurrentWeek++
        completedWorkoutsInCurrentWeek = 0
      }
    } else {
      // Missed workout - week progression stops until caught up
      break
    }
  }
  
  // Determine what workout is needed today based on completion sequence
  const currentWeekSchedule = actualCurrentWeek <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
  
  const nextWorkoutType = currentWeekSchedule[completedWorkoutsInCurrentWeek] as 'Push' | 'Pull' | 'Rest'
  
  return {
    week: actualCurrentWeek,
    workoutType: nextWorkoutType,
    dayInWeek: completedWorkoutsInCurrentWeek
  }
}

// Calculate workout for a specific date
export function getWorkoutForDate(startDate: string, targetDate: string) {
  // Use consistent date parsing to avoid timezone issues
  const start = new Date(startDate + 'T00:00:00.000Z')
  const target = new Date(targetDate + 'T00:00:00.000Z')
  
  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  // Handle negative days (before start date) - show as Rest for calendar display
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

/**
 * COMPLETION-BASED WORKOUT SCHEDULING SYSTEM
 * 
 * This function implements true completion-based progression where:
 * 1. Weeks only advance when ALL 7 workouts are completed (Push/Pull/Push/Pull/Push/Pull/Rest)
 * 2. Consecutive weeks do NOT begin until the previous week is fully completed
 * 3. Missed workouts prevent week advancement until caught up
 * 4. Week pattern: 3 complete Push/Pull cycles + 1 Rest day = 7 total workouts
 * 
 * CRITICAL: This logic must NOT use calendar-based week calculations for progression
 * Week boundaries are determined by workout completion sequences, not calendar days
 */
export function getWorkoutForDateWithCompletion(startDate: string, targetDate: string, completedWorkouts: Set<string>) {
  // Handle null or undefined startDate
  if (!startDate) {
    return {
      week: 0,
      workoutType: 'Rest' as 'Push' | 'Pull' | 'Rest',
      dayInWeek: -1,
      status: 'future' as 'completed' | 'missed' | 'future'
    }
  }
  
  // Use consistent date parsing to avoid timezone issues
  const start = new Date(startDate + 'T00:00:00.000Z')
  const target = new Date(targetDate + 'T00:00:00.000Z')
  
  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  // Handle negative days (before start date) - show no workout type for pre-program dates
  if (daysSinceStart < 0) {
    return {
      week: 0,
      workoutType: 'Rest' as 'Push' | 'Pull' | 'Rest',
      dayInWeek: -1,
      status: 'pre-program' as 'completed' | 'missed' | 'future' | 'pre-program'
    }
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetForComparison = new Date(targetDate + 'T00:00:00.000Z')
  const isPastDate = targetForComparison < today
  
  if (isPastDate) {
    const staticWorkout = getWorkoutForDate(startDate, targetDate)
    const isCompleted = completedWorkouts.has(targetDate)
    
    return {
      ...staticWorkout,
      status: isCompleted ? 'completed' as const : 'missed' as const
    }
  }
  
  // COMPLETION-BASED WEEK CALCULATION FOR FUTURE DATES
  // Week progression is based on actual workout completions, not calendar days
  // A week only advances when all 7 workouts are completed: Push/Pull/Push/Pull/Push/Pull/Rest
  // This ensures consecutive weeks only begin after previous week completion
  let actualCurrentWeek = 1
  let completedWorkoutsInCurrentWeek = 0
  
  // Count completed weeks by tracking workout sequences
  const completedDatesArray = Array.from(completedWorkouts)
  
  for (let day = 0; day < daysSinceStart; day++) {
    const checkDate = new Date(start.getTime() + (day * 24 * 60 * 60 * 1000))
    const checkDateStr = checkDate.toISOString().split('T')[0]
    
    if (checkDate >= today) break
    
    const calendarWeek = Math.floor(day / 7) + 1
    const schedule = calendarWeek <= 4 
      ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
      : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
    
    const scheduledWorkout = schedule[day % 7]
    const wasCompleted = completedDatesArray.includes(checkDateStr)
    
    if (wasCompleted || scheduledWorkout === 'Rest') {
      completedWorkoutsInCurrentWeek++
      
      // Check if we completed a full week (7 workouts)
      if (completedWorkoutsInCurrentWeek === 7) {
        actualCurrentWeek++
        completedWorkoutsInCurrentWeek = 0
      }
    } else {
      // Missed workout - week progression stops until caught up
      break
    }
  }
  
  const daysFromToday = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  // Calculate the workout position based on completion-based progression
  let projectedWorkoutPosition = completedWorkoutsInCurrentWeek
  for (let i = 0; i < daysFromToday; i++) {
    projectedWorkoutPosition++
    if (projectedWorkoutPosition >= 7) {
      projectedWorkoutPosition = 0
      actualCurrentWeek++
    }
  }
  
  // Determine schedule pattern based on completion-based week
  const schedule = actualCurrentWeek <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
  
  const workoutToShow = schedule[projectedWorkoutPosition]
  
  return {
    week: actualCurrentWeek,
    workoutType: workoutToShow as 'Push' | 'Pull' | 'Rest',
    dayInWeek: projectedWorkoutPosition,
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
