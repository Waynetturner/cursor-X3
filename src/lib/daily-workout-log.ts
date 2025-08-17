import { supabase } from './supabase'

// X3 workout schedules - Corrected per Dr. Jaquish methodology
export const WEEK_1_4_SCHEDULE = ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
export const WEEK_5_PLUS_SCHEDULE = ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const

interface DailyWorkoutLogEntry {
  user_id: string
  date: string
  workout_type: 'Push' | 'Pull' | 'Rest' | 'Missed'
  status: 'completed' | 'missed'  // Only actual outcomes, no "scheduled"
  week_number: number
}

/**
 * Get user's current date in their timezone (RENAMED for compatibility)
 * FIXED: Add validation to prevent passing dates as user IDs
 */
export async function getUserToday(userId: string): Promise<string> {
  // DEFENSIVE: Validate userId format
  if (!userId) {
    throw new Error('getUserToday: userId is required');
  }
  
  // DEFENSIVE: Check if userId looks like a date (YYYY-MM-DD format)
  if (/^\d{4}-\d{2}-\d{2}$/.test(userId)) {
    console.error('🚨 CRITICAL BUG: getUserToday received a date string instead of user ID:', userId);
    console.trace('Call stack:');
    throw new Error(`getUserToday received invalid userId (looks like a date): ${userId}`);
  }
  
  // DEFENSIVE: Check if userId looks like a UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    console.error('🚨 CRITICAL BUG: getUserToday received invalid userId format:', userId);
    console.trace('Call stack:');
    throw new Error(`getUserToday received invalid userId format: ${userId}`);
  }
  
  console.log('✅ getUserToday called with valid userId:', userId.substring(0, 8) + '...');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();
  
  if (!profile) {
    throw new Error('User profile not found');
  }
  
  const userTimezone = profile.timezone;
  return new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
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
    // Narrow workout_type to valid schedule entries (exclude 'Missed')
    let dayInWeek = 0
    if (entry.workout_type === 'Push' || entry.workout_type === 'Pull' || entry.workout_type === 'Rest') {
      dayInWeek = schedule.indexOf(entry.workout_type)
      if (dayInWeek < 0) dayInWeek = 0
    }
    
    return {
      workoutType: entry.workout_type as 'Push' | 'Pull' | 'Rest',
      week: entry.week_number,
      status: 'completed',
      dayInWeek: dayInWeek >= 0 ? dayInWeek : 0
    }
  }

  // Check if this date has a missed entry
  const { data: missedEntry } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('date', targetDate)
    .eq('status', 'missed')
  
  if (missedEntry && missedEntry.length > 0) {
    const entry = missedEntry[0]
    const schedule = entry.week_number <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    let dayInWeek = 0
    if (entry.workout_type === 'Push' || entry.workout_type === 'Pull' || entry.workout_type === 'Rest') {
      dayInWeek = schedule.indexOf(entry.workout_type)
      if (dayInWeek < 0) dayInWeek = 0
    }
    
    return {
      workoutType: entry.workout_type as 'Push' | 'Pull' | 'Rest',
      week: entry.week_number,
      status: 'missed',
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
  // Note: We already returned if actual exercise exists; leave status as scheduled/missed here
  
  return {
    workoutType: position.workoutType,
    week: position.week,
    status,
    dayInWeek: position.dayInWeek
  }
}

/**
 * Calculate dynamic position based purely on completion history
 * Simple state machine approach - tracks completion history and determines next workout
 */
async function calculateDynamicPosition(userId: string, targetDate: string): Promise<{
  workoutType: 'Push' | 'Pull' | 'Rest'
  week: number
  dayInWeek: number
}> {
  console.log('🧮 Calculating dynamic position for:', targetDate)
  
  // Get the most recent completed workout (excluding Missed entries)
  const { data: recentWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('workout_type', 'Missed')
    .order('date', { ascending: false })
    .limit(1)
  
  if (!recentWorkouts || recentWorkouts.length === 0) {
    console.log('🎯 No workout history found, starting from beginning')
    return {
      workoutType: 'Push',
      week: 1,
      dayInWeek: 0
    }
  }
  
  const lastWorkout = recentWorkouts[0]
  console.log('🔍 Last completed workout:', lastWorkout)
  
  // Determine schedule based on week
  const schedule = lastWorkout.week_number <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
  console.log('📋 Using schedule:', schedule, 'for week', lastWorkout.week_number)
  
  // Calculate how many days to advance from last completed workout to targetDate
  const lastDate = new Date(lastWorkout.date)
  const target = new Date(targetDate)
  lastDate.setHours(0,0,0,0)
  target.setHours(0,0,0,0)
  const daysDiff = Math.max(0, Math.round((target.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Get the actual position of the last workout within its week
  // by counting completed workouts in that week up to that date
  const { data: weekWorkouts } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .eq('week_number', lastWorkout.week_number)
    .eq('status', 'completed')
    .neq('workout_type', 'Missed')
    .lte('date', lastWorkout.date)
    .order('date', { ascending: true })

  let currentPosition = 0
  if (weekWorkouts && weekWorkouts.length > 0) {
    // The position is the count minus 1 (0-indexed)
    currentPosition = weekWorkouts.length - 1
    console.log(`📊 Found ${weekWorkouts.length} completed workouts in week ${lastWorkout.week_number} up to ${lastWorkout.date}`)
    console.log(`📊 Week workouts:`, weekWorkouts.map(w => `${w.date}: ${w.workout_type}`))
  }
  
  console.log(`📍 Last workout ${lastWorkout.workout_type} is at position ${currentPosition} in week ${lastWorkout.week_number}`)

  // Calculate next position and week
  let projectedWeek = lastWorkout.week_number
  let projectedPosition = currentPosition
  
  if (daysDiff > 0) {
    // If the last workout was a Rest day, we start a new week
    if (lastWorkout.workout_type === 'Rest') {
      projectedWeek = lastWorkout.week_number + 1
      projectedPosition = (daysDiff - 1) % schedule.length
    } else {
      // Continue in the current week until we hit a Rest day
      const nextPosition = currentPosition + daysDiff
      
      if (nextPosition >= schedule.length) {
        // We've gone past the end of the current week
        const weeksCompleted = Math.floor(nextPosition / schedule.length)
        projectedWeek = lastWorkout.week_number + weeksCompleted
        projectedPosition = nextPosition % schedule.length
      } else {
        // Still in the same week
        projectedPosition = nextPosition
      }
    }
  }
  
  const projectedWorkout = schedule[projectedPosition]

  console.log('🎯 Projected workout calculation:', {
    lastPosition: currentPosition,
    daysDiff,
    projectedPosition,
    projectedWorkout,
    currentWeek: lastWorkout.week_number,
    projectedWeek
  })

  return {
    workoutType: projectedWorkout as 'Push' | 'Pull' | 'Rest',
    week: projectedWeek,
    dayInWeek: projectedPosition
  }
}

/**
 * Mark a workout as missed for a specific date
 * This shifts the entire schedule forward
 */
export async function markWorkoutAsMissed(userId: string, missedDate: string): Promise<void> {
  try {
    // Calculate what workout was supposed to happen on this date
    const workoutInfo = await calculateWorkoutForDate(userId, missedDate)
    
    // Only mark as missed if it's not already logged
    const { data: existingEntry } = await supabase
      .from('daily_workout_log')
      .select('*')
      .eq('user_id', userId)
      .eq('date', missedDate)
    
    if (!existingEntry || existingEntry.length === 0) {
      await supabase
        .from('daily_workout_log')
        .insert({
          user_id: userId,
          date: missedDate,
          workout_type: workoutInfo.workoutType,
          status: 'missed',
          week_number: workoutInfo.week
        })
      
      console.log(`🔴 Marked ${workoutInfo.workoutType} as missed on ${missedDate}`)
    }
  } catch (error) {
    console.error('Error marking workout as missed:', error)
    throw error
  }
}

/**
 * Clean up pre-filled entries (run this once to fix the database)
 */
export async function cleanPrefilledEntries(userId: string): Promise<void> {
  if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log('🧹 Cleaning pre-filled scheduled entries...')
  
  // Delete all scheduled entries (keep only completed ones)
  const { error } = await supabase
    .from('daily_workout_log')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'scheduled')
  
  if (error) {
    console.error('Error cleaning prefilled entries:', error)
  } else {
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log('✅ Pre-filled entries cleaned')
  }
}

/**
 * Ensure today's entry exists (but don't pre-fill future dates)
 * Now actually creates today's entry if it doesn't exist
 */
export async function ensureTodaysEntry(): Promise<void> {
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;
  
  const today = await getUserToday(user.id);
  
  // Check if today already has an entry
  const { data: existingEntry } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();
  
  if (!existingEntry) {
    // Calculate what today should be
    const workoutInfo = await calculateWorkoutForDate(user.id, today);
    
    // Only create an entry if it's supposed to be a workout day and it's not completed yet
    if (workoutInfo.workoutType !== 'Rest') {
      await supabase
        .from('daily_workout_log')
        .insert({
          user_id: user.id,
          date: today,
          workout_type: workoutInfo.workoutType,
          status: 'missed', // Past dates without completion are considered missed
          week_number: workoutInfo.week
        });
      
      console.log(`📝 Created today's entry: ${workoutInfo.workoutType} for ${today}`);
    }
  }
}

/**
 * Mark missed workouts - creates actual log entries for past dates without workouts
 */
export async function markMissedWorkouts(): Promise<void> {
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;
  
  const today = await getUserToday(user.id);
  
  // Get user's start date
  const { data: profile } = await supabase
    .from('profiles')
    .select('x3_start_date')
    .eq('id', user.id)
    .single();
  
  if (!profile?.x3_start_date) return;
  
  // Get all existing log entries
  const { data: existingEntries } = await supabase
    .from('daily_workout_log')
    .select('date')
    .eq('user_id', user.id);
  
  const existingDates = new Set(existingEntries?.map(e => e.date) || []);
  
  // Check each day from start date to yesterday
  const startDate = new Date(profile.x3_start_date);
  const todayDate = new Date(today);
  
  for (let d = new Date(startDate); d < todayDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('en-CA');
    
    if (!existingDates.has(dateStr)) {
      // This date has no entry - mark as missed
      await markWorkoutAsMissed(user.id, dateStr);
    }
  }
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
  if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log('Getting workout for today (unified calc):', today)

  try {
    const workout = await calculateWorkoutForDate(userId, today)
    return {
      workoutType: workout.workoutType,
      week: workout.week,
      status: workout.status === 'completed' ? 'completed' : 'scheduled',
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
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log('📝 Updating daily workout log:', { userId, workoutDate, workoutType })
    
    const workoutInfo = await calculateWorkoutForDate(userId, workoutDate)
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log('📊 Calculated workout info:', workoutInfo)
    
    // First check if an entry already exists
    const { data: existingEntry } = await supabase
      .from('daily_workout_log')
      .select('*')
      .eq('user_id', userId)
      .eq('date', workoutDate)
      .single()
    
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log('🔍 Existing entry:', existingEntry)
    
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
    
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log(`✅ Workout logged: ${workoutType} on ${workoutDate}`)
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
    
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log(`✅ Rest day completed: ${dateToComplete}`)
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
 * Audit and repair daily_workout_log to match actual completed workouts in workout_exercises
 * - For each day with completed exercises, ensure a log entry exists
 * - For each day with no completed exercises, mark as missed if in the past
 * - Only allow 3 Push and 3 Pull per week for week 5+
 */
export async function auditAndRepairDailyWorkoutLog(userId: string) {
  // Get all exercises for user
  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select('workout_local_date_time, workout_type, week_number')
    .eq('user_id', userId)
  if (!exercises) return

  // Map exercises by date
  const byDate: Record<string, { workout_type: string; week_number: number }> = {}
  exercises.forEach(ex => {
    const date = new Date(ex.workout_local_date_time).toLocaleDateString('en-CA')
    if (!byDate[date] && (ex.workout_type === 'Push' || ex.workout_type === 'Pull' || ex.workout_type === 'Rest')) {
      byDate[date] = {
        workout_type: ex.workout_type,
        week_number: ex.week_number
      }
    }
  })

  // Get all log entries for user
  const { data: logs } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
  const logByDate: Record<string, any> = {}
  logs?.forEach(log => {
    logByDate[log.date] = log
  })

  // For each day in the exercise map, ensure a completed log entry exists, but never overwrite Rest/Missed
  for (const date in byDate) {
    if (!logByDate[date]) {
      await supabase.from('daily_workout_log').insert({
        user_id: userId,
        date,
        workout_type: byDate[date].workout_type,
        status: 'completed',
        week_number: byDate[date].week_number
      })
    } else if (
      logByDate[date].workout_type === 'Rest' ||
      logByDate[date].workout_type === 'Missed'
    ) {
      // Do not overwrite Rest or Missed days
      continue
    }
    // If log entry exists and is not Rest/Missed, do nothing (preserve)
  }

  // For each day in the past with no exercise, mark as missed if not already, but never overwrite Rest
  const today = await getUserToday(userId)
  for (const logDate in logByDate) {
    if (
      !byDate[logDate] &&
      logDate < today &&
      logByDate[logDate].workout_type !== 'Missed' &&
      logByDate[logDate].workout_type !== 'Rest'
    ) {
      await supabase.from('daily_workout_log').update({
        workout_type: 'Missed',
        status: 'completed'
      }).eq('user_id', userId).eq('date', logDate)
    }
  }

  // For week 5+, ensure no more than 3 Push and 3 Pull per week
  const weekCounts: Record<number, { push: number; pull: number }> = {}
  for (const date in byDate) {
    const entry = byDate[date]
    if (entry.week_number >= 5) {
      if (!weekCounts[entry.week_number]) weekCounts[entry.week_number] = { push: 0, pull: 0 }
      if (entry.workout_type === 'Push') weekCounts[entry.week_number].push++
      if (entry.workout_type === 'Pull') weekCounts[entry.week_number].pull++
    }
  }
  for (const week in weekCounts) {
    if (weekCounts[week].push > 3 || weekCounts[week].pull > 3) {
      // Find excess days and mark as Rest in log
      let pushSeen = 0, pullSeen = 0
      for (const date in byDate) {
        const entry = byDate[date]
        if (entry.week_number == Number(week)) {
          if (entry.workout_type === 'Push') {
            pushSeen++
            if (pushSeen > 3) {
              await supabase.from('daily_workout_log').update({
                workout_type: 'Rest',
                status: 'completed'
              }).eq('user_id', userId).eq('date', date)
            }
          }
          if (entry.workout_type === 'Pull') {
            pullSeen++
            if (pullSeen > 3) {
              await supabase.from('daily_workout_log').update({
                workout_type: 'Rest',
                status: 'completed'
              }).eq('user_id', userId).eq('date', date)
            }
          }
        }
      }
    }
  }
}

/**
 * Daily audit: Ensure daily_workout_log matches actual completed workouts in workout_exercises
 */
export async function auditDailyWorkoutLog(userId: string, startDate: string, endDate: string): Promise<void> {
  // Get all workout_exercises for the user in the date range
  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select('workout_local_date_time, workout_type, week_number')
    .eq('user_id', userId)
    .gte('workout_local_date_time', startDate + 'T00:00:00')
    .lte('workout_local_date_time', endDate + 'T23:59:59')

  if (!exercises || exercises.length === 0) return

  // Group by date
  const byDate: Record<string, { workout_type: string; week_number: number }> = {}
  for (const ex of exercises) {
    const date = new Date(ex.workout_local_date_time).toLocaleDateString('en-CA')
    // Only log first workout_type for the day (Push/Pull)
    if (!byDate[date] && (ex.workout_type === 'Push' || ex.workout_type === 'Pull')) {
      byDate[date] = { workout_type: ex.workout_type, week_number: ex.week_number }
    }
  }

  // For each day, ensure daily_workout_log has a completed entry
  for (const date of Object.keys(byDate)) {
    const { workout_type, week_number } = byDate[date]
    const { data: existingEntry } = await supabase
      .from('daily_workout_log')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('workout_type', workout_type)
      .eq('status', 'completed')
      .single()
    if (!existingEntry) {
      await supabase
        .from('daily_workout_log')
        .insert({
          user_id: userId,
          date,
          workout_type,
          status: 'completed',
          week_number
        })
      if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') console.log(`✅ Audit: Logged ${workout_type} for ${date}`)
    }
  }
}

/**
 * Remove backfill - dynamic calculation only
 * The schedule should be calculated dynamically based on actual completions
 */
export async function backfillDailyWorkoutLog(userId: string): Promise<void> {
  // Clean up any existing pre-filled data
  await cleanPrefilledEntries(userId)
  console.log('✅ Daily workout log is now clean - only actual completions remain')
  console.log('📊 All workout scheduling is now calculated dynamically')
}