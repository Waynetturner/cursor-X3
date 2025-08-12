import { supabase } from './supabase'

// X3 workout schedules
export const WEEK_1_4_SCHEDULE = ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
export const WEEK_5_PLUS_SCHEDULE = ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const

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
  console.log(`📅 Calculating workout for ${targetDate}`)
  
  // Get the last 7 days of completed workouts to determine the current position
  const { data: completedWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('workout_type', 'Missed')
    .order('date', { ascending: false })
    .limit(7)

  if (!completedWorkouts || completedWorkouts.length === 0) {
    console.log('No completed workouts - starting at Week 1, Day 0')
    return {
      workoutType: 'Push',
      week: 1,
      dayInWeek: 0
    }
  }
  
  // Get the last completed workout
  const lastWorkout = completedWorkouts[0]
  console.log('Last completed workout:', lastWorkout)
  
  // Get the appropriate schedule
  const initialSchedule = lastWorkout.week_number <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
  console.log('Using schedule:', initialSchedule)
  
  // Find position of last workout in schedule
  const initialLastPosition = initialSchedule.indexOf(lastWorkout.workout_type)
  console.log('Last workout position in schedule:', initialLastPosition)
  
  if (initialLastPosition === -1) {
    console.error('Invalid last workout type:', lastWorkout.workout_type)
    return {
      workoutType: 'Push',
      week: lastWorkout.week_number,
      dayInWeek: 0
    }
  }
  
  // Calculate next position
  const initialNextPosition = (initialLastPosition + 1) % initialSchedule.length
  const nextWorkout = initialSchedule[initialNextPosition]
  const initialWeekIncrement = initialNextPosition === 0 ? 1 : 0
  
  console.log('Next workout calculation:', {
    position: initialNextPosition,
    type: nextWorkout,
    weekIncrement: initialWeekIncrement
  })

  // Get all completed workouts to determine current week and position
  const { data: allWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('workout_type', 'Missed')
    .order('date', { ascending: true })

  // Handle no completed workouts case
  if (!allWorkouts || allWorkouts.length === 0) {
    return {
      workoutType: WEEK_1_4_SCHEDULE[0],
      week: 1,
      dayInWeek: 0
    }
  }

  // Get the last completed workout
  const lastCompleted = allWorkouts[allWorkouts.length - 1]
  console.log('Last completed workout:', lastCompleted)

  // Calculate days between target date and last workout
  const lastCompletedDate = new Date(lastCompleted.date)
  const targetDateObj = new Date(targetDate)
  const daysSince = Math.floor(
    (targetDateObj.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Start from last completed workout's week and position
  let currentWeek = lastCompleted.week_number
  let currentPosition = 0
  
  // Get starting schedule based on week
  let schedule = currentWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
  currentPosition = schedule.indexOf(lastCompleted.workout_type)

  if (currentPosition === -1) {
    console.error('Invalid last workout type:', lastCompleted.workout_type)
    return {
      workoutType: schedule[0],
      week: currentWeek,
      dayInWeek: 0
    }
  }

  // Move to next position after last workout
  currentPosition = (currentPosition + 1) % schedule.length
  if (currentPosition === 0) {
    currentWeek++
    schedule = currentWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
  }

  // Log starting point
  console.log('Starting projection:', {
    lastWorkoutDate: lastCompleted.date,
    targetDate,
    daysSince,
    startWeek: currentWeek,
    startPosition: currentPosition
  })

  // For each additional day, advance the schedule
  for (let i = 1; i < daysSince; i++) {
    currentPosition = (currentPosition + 1) % schedule.length
    if (currentPosition === 0) {
      currentWeek++
      schedule = currentWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    }
  }

  console.log('Final calculation:', {
    targetDate,
    week: currentWeek,
    position: currentPosition,
    workout: schedule[currentPosition]
  })

  return {
    workoutType: schedule[currentPosition],
    week: currentWeek,
    dayInWeek: currentPosition
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
  console.log('Getting workout for today:', today)
  
  try {
    // Get the last 7 completed workouts to properly determine the sequence
    const { data: recentWorkouts } = await supabase
      .from('daily_workout_log')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(7)
    
    console.log('Recent completed workouts:', recentWorkouts)

    if (recentWorkouts && recentWorkouts.length > 0) {
      const lastEntry = recentWorkouts[0]
      console.log('Last completed workout:', lastEntry)
      
      // Determine schedule based on week number
      const schedule = lastEntry.week_number <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
      console.log('Using schedule:', schedule)
      
      // Look at recent workouts to validate the sequence
      let workoutsInCurrentCycle = 0
      let lastPushPullIndex = -1
      
      for (const workout of recentWorkouts) {
        if (workout.workout_type === 'Rest') {
          break // Found a rest day, stop counting
        }
        workoutsInCurrentCycle++
        if (workout.workout_type === 'Push' || workout.workout_type === 'Pull') {
          lastPushPullIndex = schedule.indexOf(workout.workout_type)
        }
      }
      
      console.log('Workouts in current cycle:', workoutsInCurrentCycle)
      console.log('Last Push/Pull position in schedule:', lastPushPullIndex)
      
      if (lastPushPullIndex !== -1) {
        // Calculate next workout in sequence
        const nextPosition = (lastPushPullIndex + 1) % schedule.length
        const workoutType = schedule[nextPosition]
        const isNewWeek = workoutsInCurrentCycle >= 6 // After 6 workouts (3 pairs of Push/Pull), take a Rest
        
        console.log('Next workout calculation:', {
          lastWorkout: lastEntry.workout_type,
          nextWorkout: workoutType,
          currentWeek: lastEntry.week_number,
          workoutsInCycle: workoutsInCurrentCycle,
          isNewWeek
        })
        
        return {
          workoutType: isNewWeek ? 'Rest' : workoutType,
          week: lastEntry.week_number + (isNewWeek ? 1 : 0),
          status: 'scheduled',
          dayInWeek: isNewWeek ? 6 : nextPosition
        }
      }
    }

    // Fallback to calculate from scratch if no last workout
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
    console.log('🔄 Updating daily workout log:', { userId, workoutDate, workoutType })
    
    const workoutInfo = await calculateWorkoutForDate(userId, workoutDate)
    console.log('📊 Calculated workout info:', workoutInfo)
    
    // First check if an entry already exists
    const { data: existingEntry } = await supabase
      .from('daily_workout_log')
      .select('*')
      .eq('user_id', userId)
      .eq('date', workoutDate)
      .single()
    
    console.log('🔍 Existing entry:', existingEntry)
    
    if (existingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('daily_workout_log')
        .update({
          workout_type: workoutType,
          status: 'completed',
          week_number: workoutInfo.week
        })
        .eq('user_id', userId)
        .eq('date', workoutDate)
      
      if (updateError) {
        console.error('❌ Error updating entry:', updateError)
        throw updateError
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase
        .from('daily_workout_log')
        .insert({
          user_id: userId,
          date: workoutDate,
          workout_type: workoutType,
          status: 'completed',
          week_number: workoutInfo.week
        })
      
      if (insertError) {
        console.error('❌ Error inserting entry:', insertError)
        throw insertError
      }
    }
    
    console.log(`✅ Workout logged: ${workoutType} on ${workoutDate}`)
  } catch (error) {
    console.error('❌ Error updating daily workout log:', error)
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