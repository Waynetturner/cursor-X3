import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export const X3_EXERCISES = {
  Push: ['Chest Press', 'Tricep Press', 'Overhead Press', 'Front Squat'],
  Pull: ['Deadlift', 'Bent Row', 'Bicep Curl', 'Calf Raise']
}

export const BAND_COLORS = ['White', 'Light Gray', 'Dark Gray', 'Black']

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
  const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
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
  const today = new Date()
  let currentStreak = 0
  
  // Start from today and work backwards
  for (let i = 0; i >= -365; i--) { // Check up to 365 days back
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() + i)
    const checkDateStr = checkDate.toISOString().split('T')[0]
    
    // Skip future dates
    if (checkDate > today) continue
    
    const scheduledWorkout = getWorkoutForDate(startDate, checkDateStr)
    
    let dayCompleted = false
    
    if (scheduledWorkout.workoutType === 'Rest') {
      // Rest day - check if user marked it as completed OR if it's a scheduled rest day
      // For now, assume all rest days are completed (since user follows schedule)
      dayCompleted = true
    } else {
      // Workout day - check if user has workout data for this date
      dayCompleted = workoutDates.includes(checkDateStr)
    }
    
    if (dayCompleted) {
      if (i <= 0) currentStreak++ // Only count if it's today or in the past
    } else {
      // Break the streak if a day was missed
      break
    }
  }
  
  return currentStreak
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