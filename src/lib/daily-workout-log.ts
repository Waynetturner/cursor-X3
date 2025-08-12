import { supabase } from './supabase'

// X3 workout schedules
const WEEK_1_4_SCHEDULE = ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
const WEEK_5_PLUS_SCHEDULE = ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const

interface DailyWorkoutLogEntry {
  user_id: string
  date: string
  workout_type: 'Push' | 'Pull' | 'Rest' | 'Missed'
  status: 'completed' | 'scheduled'
  week_number: number
}

/**
 * Get user's timezone and today's date
 */
async function getUserToday(userId: string): Promise<string> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
  
  const userTimezone = (profiles && profiles.length > 0) ? profiles[0].timezone : 'America/Chicago'
  return new Date().toLocaleDateString('en-CA', { timeZone: userTimezone || 'America/Chicago' })
}

/**
 * PURE DYNAMIC CALCULATION: Never pre-fill, always calculate from completion history
 */
export async function calculateWorkoutForDate(
  userId: string, 
  targetDate: string
): Promise<{
  workoutType: 'Push' | 'Pull' | 'Rest'
  week: number
  status: 'completed' | 'scheduled' | 'missed'
  dayInWeek: number
}> {
  const today = await getUserToday(userId)
  
  // ONLY check for actual completed entries - ignore any scheduled/pre-filled entries
  const { data: completedEntry } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('date', targetDate)
    .eq('status', 'completed')
  
  // If this date was actually completed, return it
  if (completedEntry && completedEntry.length > 0) {
    const entry = completedEntry[0]
    const schedule = entry.week_number <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    const dayInWeek = schedule.indexOf(entry.workout_type as any)
    
    return {
      workoutType: entry.workout_type as 'Push' | 'Pull' | 'Rest',
      week: entry.week_number,
      status: 'completed',
      dayInWeek: dayInWeek >= 0 ? dayInWeek : 0
    }
  }
  
  // DYNAMIC CALCULATION: Calculate what this date should be based on completion history
  const position = await calculateDynamicPosition(userId, targetDate)
  
  // Determine status
  let status: 'completed' | 'scheduled' | 'missed' = 'scheduled'
  if (targetDate < today) {
    status = 'missed'
  }
  if (targetDate === today) {
    // Check if today has actual exercise data
    const { data: exercises } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', userId)
      .gte('workout_local_date_time', `${targetDate}T00:00:00`)
      .lt('workout_local_date_time', `${targetDate}T23:59:59`)
    
    if (exercises && exercises.length > 0) {
      status = 'completed'
    }
  }
  
  return {
    workoutType: position.workoutType,
    week: position.week,
    status,
    dayInWeek: position.dayInWeek
  }
}

/**
 * Calculate dynamic position based purely on completion history
 */
async function calculateDynamicPosition(userId: string, targetDate: string): Promise<{
  workoutType: 'Push' | 'Pull' | 'Rest'
  week: number
  dayInWeek: number
}> {
  // Get ALL completed workouts (never scheduled/pre-filled ones)
  const { data: completedWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('workout_type', 'Missed')
    .order('date', { ascending: true })
  
  if (!completedWorkouts || completedWorkouts.length === 0) {
    // No completed workouts - start at Week 1, Day 0
    return {
      workoutType: 'Push',
      week: 1,
      dayInWeek: 0
    }
  }
  
  // Count complete cycles
  let currentWeek = 1
  let workoutsInCurrentCycle = 0
  
  for (const workout of completedWorkouts) {
    workoutsInCurrentCycle++
    
    // Complete cycle = 7 workouts
    if (workoutsInCurrentCycle >= 7) {
      currentWeek++
      workoutsInCurrentCycle = 0
    }
  }
  
  // Calculate days since last completed workout
  const lastCompletedDate = completedWorkouts[completedWorkouts.length - 1].date
  const daysSinceLastCompleted = Math.floor(
    (new Date(targetDate).getTime() - new Date(lastCompletedDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Next position = where we left off + days since
  const nextPosition = (workoutsInCurrentCycle + daysSinceLastCompleted) % 7
  
  // If we wrapped around, advance week
  if (workoutsInCurrentCycle + daysSinceLastCompleted >= 7) {
    currentWeek++
  }
  
  // Get workout type from schedule
  const schedule = currentWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
  const workoutType = schedule[nextPosition]
  
  return {
    workoutType,
    week: currentWeek,
    dayInWeek: nextPosition
  }
}

/**
 * Clean up pre-filled entries (run this once to fix the database)
 */
export async function cleanPrefilledEntries(userId: string): Promise<void> {
  console.log('🧹 Cleaning pre-filled scheduled entries...')
  
  // Delete all scheduled entries (keep only completed ones)
  const { error } = await supabase
    .from('daily_workout_log')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'scheduled')
  
  if (error) {
    console.error('Error cleaning prefilled entries:', error)
  } else {
    console.log('✅ Pre-filled entries cleaned')
  }
}

/**
 * Ensure today's entry exists (but don't pre-fill future dates)
 */
export async function ensureTodaysEntry(userId: string): Promise<void> {
  // Only clean pre-filled entries, don't create new ones
  // The calendar will calculate dynamically
}

/**
 * Mark missed workouts - but don't create them, just mark existing ones
 */
export async function markMissedWorkouts(userId: string): Promise<void> {
  // The dynamic calculation handles missed logic
  // No need to pre-create missed entries
}

/**
 * Get today's workout using dynamic calculation
 */
export async function getTodaysWorkoutFromLog(userId: string): Promise<{
  workoutType: 'Push' | 'Pull' | 'Rest'
  week: number
  status: 'completed' | 'scheduled'
  dayInWeek: number
} | null> {
  const today = await getUserToday(userId)
  
  try {
    const workout = await calculateWorkoutForDate(userId, today)
    return {
      workoutType: workout.workoutType,
      week: workout.week,
      status: workout.status as 'completed' | 'scheduled',
      dayInWeek: workout.dayInWeek
    }
  } catch (error) {
    console.error('Error calculating today\'s workout:', error)
    return null
  }
}

/**
 * ONLY write to log when workout is actually completed
 */
export async function updateDailyWorkoutLog(
  userId: string, 
  workoutDate: string,
  workoutType: 'Push' | 'Pull'
): Promise<void> {
  try {
    const workoutInfo = await calculateWorkoutForDate(userId, workoutDate)
    
    // ONLY create entry when actually completing a workout
    await supabase
      .from('daily_workout_log')
      .upsert({
        user_id: userId,
        date: workoutDate,
        workout_type: workoutType,
        status: 'completed',
        week_number: workoutInfo.week
      }, { onConflict: 'user_id,date' })
    
    console.log(`✅ Workout logged: ${workoutType} on ${workoutDate}`)
  } catch (error) {
    console.error('Error updating daily workout log:', error)
    throw error
  }
}

/**
 * Complete rest day - only when it actually happens
 */
export async function completeRestDay(userId: string, restDate?: string): Promise<void> {
  const dateToComplete = restDate || await getUserToday(userId)
  
  try {
    const workoutInfo = await calculateWorkoutForDate(userId, dateToComplete)
    
    await supabase
      .from('daily_workout_log')
      .upsert({
        user_id: userId,
        date: dateToComplete,
        workout_type: 'Rest',
        status: 'completed',
        week_number: workoutInfo.week
      }, { onConflict: 'user_id,date' })
    
    console.log(`✅ Rest day completed: ${dateToComplete}`)
  } catch (error) {
    console.error('Error completing rest day:', error)
    throw error
  }
}

/**
 * Get workout data for a specific date from the log
 */
export async function getWorkoutForDateFromLog(
  userId: string,
  date: string
): Promise<DailyWorkoutLogEntry | null> {
  const { data: entries } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('status', 'completed') // Only return actual completed entries
  
  return entries && entries.length > 0 ? entries[0] : null
}

/**
 * Calculate streak from actual completions only
 */
export async function calculateStreakFromLog(userId: string): Promise<number> {
  const today = await getUserToday(userId)
  const { data: workouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed') // Only count actual completions
    .lte('date', today)
    .order('date', { ascending: false })
  
  if (!workouts || workouts.length === 0) {
    return 0
  }
  
  let streak = 0
  
  for (const workout of workouts) {
    if (workout.workout_type === 'Missed') {
      break
    }
    streak++
  }
  
  return streak
}

/**
 * Remove backfill - no pre-filling allowed
 */
export async function backfillDailyWorkoutLog(userId: string): Promise<void> {
  // Clean up any existing pre-filled data
  await cleanPrefilledEntries(userId)
  console.log('✅ Daily workout log is now clean - only actual completions remain')
}