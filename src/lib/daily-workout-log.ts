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
 * Get today's workout from the daily_workout_log
 */
export async function getTodaysWorkoutFromLog(userId: string): Promise<{
  workoutType: 'Push' | 'Pull' | 'Rest'
  week: number
  status: 'completed' | 'scheduled'
  dayInWeek: number
} | null> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  
  if (error || !data) {
    console.error('Error fetching today\'s workout:', error)
    return null
  }
  
  // Calculate day in week based on the sequence
  const { data: weekData } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('week_number', data.week_number)
    .eq('status', 'completed')
    .order('date', { ascending: true })
  
  const dayInWeek = weekData?.length || 0
  
  return {
    workoutType: data.workout_type as 'Push' | 'Pull' | 'Rest',
    week: data.week_number,
    status: data.status,
    dayInWeek
  }
}

/**
 * Update daily_workout_log when a workout is completed
 */
export async function updateDailyWorkoutLog(
  userId: string, 
  workoutDate: string,
  workoutType: 'Push' | 'Pull'
): Promise<void> {
  console.log(`📝 Updating daily_workout_log for ${workoutDate}`)
  
  try {
    // Mark today's workout as completed
    const { error: updateError } = await supabase
      .from('daily_workout_log')
      .update({ 
        workout_type: workoutType,
        status: 'completed' 
      })
      .eq('user_id', userId)
      .eq('date', workoutDate)
    
    if (updateError) {
      console.error('Error updating workout log:', updateError)
      throw updateError
    }
    
    // Update future scheduled workouts
    await updateFutureSchedule(userId, workoutDate)
    
    console.log('✅ Daily workout log updated successfully')
  } catch (error) {
    console.error('❌ Error updating daily workout log:', error)
    throw error
  }
}

/**
 * Update future workout schedule based on what was completed today
 */
async function updateFutureSchedule(userId: string, completedDate: string): Promise<void> {
  // Get user's profile for start date
  const { data: profile } = await supabase
    .from('profiles')
    .select('x3_start_date')
    .eq('id', userId)
    .single()
  
  if (!profile?.x3_start_date) return
  
  // Get all completed workouts up to today
  const { data: completedWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .lte('date', completedDate)
    .order('date', { ascending: true })
  
  if (!completedWorkouts) return
  
  // Calculate current position in sequence
  let actualWeek = 1
  let sequencePosition = 0
  
  for (const workout of completedWorkouts) {
    if (workout.workout_type !== 'Missed') {
      sequencePosition = (sequencePosition + 1) % 7
      if (sequencePosition === 0) {
        actualWeek++
      }
    }
  }
  
  // Update future scheduled workouts
  const tomorrow = new Date(completedDate)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Get next 14 days of scheduled workouts
  const { data: futureWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('date', tomorrow.toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(14)
  
  if (!futureWorkouts) return
  
  // Update each future workout
  for (const futureWorkout of futureWorkouts) {
    const schedule = actualWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    const scheduledWorkout = schedule[sequencePosition]
    
    await supabase
      .from('daily_workout_log')
      .update({
        workout_type: scheduledWorkout,
        week_number: actualWeek
      })
      .eq('id', futureWorkout.id)
    
    sequencePosition = (sequencePosition + 1) % 7
    if (sequencePosition === 0) {
      actualWeek++
    }
  }
}

/**
 * Mark missed workouts for past dates
 */
export async function markMissedWorkouts(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  // Find all scheduled workouts before today that aren't Push/Pull/Rest
  const { data: missedWorkouts, error } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .lt('date', today)
    .neq('workout_type', 'Rest')
  
  if (error || !missedWorkouts || missedWorkouts.length === 0) {
    return
  }
  
  console.log(`📅 Marking ${missedWorkouts.length} missed workouts`)
  
  // Update each missed workout
  for (const workout of missedWorkouts) {
    await supabase
      .from('daily_workout_log')
      .update({
        workout_type: 'Missed',
        status: 'completed'
      })
      .eq('id', workout.id)
  }
  
  // Check for 8-day reset rule
  const { data: recentMisses } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_type', 'Missed')
    .order('date', { ascending: false })
    .limit(8)
  
  if (recentMisses && recentMisses.length >= 8) {
    // Check if they're consecutive
    let consecutive = true
    for (let i = 1; i < recentMisses.length; i++) {
      const date1 = new Date(recentMisses[i-1].date)
      const date2 = new Date(recentMisses[i].date)
      const dayDiff = Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24))
      if (dayDiff !== 1) {
        consecutive = false
        break
      }
    }
    
    if (consecutive) {
      console.log('🔄 8 consecutive misses detected - program reset required')
      // Reset future workouts to Week 1
      await resetProgramToWeek1(userId)
    }
  }
}

/**
 * Reset program to Week 1 after 8 consecutive misses
 */
async function resetProgramToWeek1(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  // Update all future scheduled workouts
  const { data: futureWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('date', today)
    .order('date', { ascending: true })
  
  if (!futureWorkouts) return
  
  let sequencePosition = 0
  const week = 1
  
  for (const workout of futureWorkouts) {
    const schedule = WEEK_1_4_SCHEDULE
    const scheduledWorkout = schedule[sequencePosition]
    
    await supabase
      .from('daily_workout_log')
      .update({
        workout_type: scheduledWorkout,
        week_number: week
      })
      .eq('id', workout.id)
    
    sequencePosition = (sequencePosition + 1) % 7
  }
  
  console.log('✅ Program reset to Week 1')
}

/**
 * Get workout data for a specific date from the log
 */
export async function getWorkoutForDateFromLog(
  userId: string,
  date: string
): Promise<DailyWorkoutLogEntry | null> {
  const { data, error } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

/**
 * Calculate streak from daily_workout_log
 */
export async function calculateStreakFromLog(userId: string): Promise<number> {
  const today = new Date()
  const { data: workouts, error } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: false })
  
  if (error || !workouts || workouts.length === 0) {
    return 0
  }
  
  let streak = 0
  
  for (const workout of workouts) {
    if (workout.workout_type === 'Missed') {
      break
    }
    if (workout.status === 'completed') {
      streak++
    }
  }
  
  return streak
}
