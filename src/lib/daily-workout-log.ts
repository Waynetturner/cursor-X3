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

// Cache for database entries to avoid repeated queries
let dbEntriesCache: Record<string, DailyWorkoutLogEntry> | null = null
let cacheUserId: string | null = null

/**
 * Load all database entries for a user in one query and cache them
 */
async function loadAllUserEntries(userId: string): Promise<Record<string, DailyWorkoutLogEntry>> {
  // Return cached data if we have it for this user
  if (cacheUserId === userId && dbEntriesCache) {
    return dbEntriesCache
  }

  console.log('📊 Loading all daily workout log entries for user...')
  
  const { data: entries, error } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error loading daily workout log entries:', error)
    return {}
  }
  
  // Convert to map for fast lookups
  const entriesMap: Record<string, DailyWorkoutLogEntry> = {}
  entries?.forEach(entry => {
    entriesMap[entry.date] = entry
  })
  
  // Cache the results
  dbEntriesCache = entriesMap
  cacheUserId = userId
  
  console.log(`📊 Loaded ${entries?.length || 0} database entries`)
  return entriesMap
}

/**
 * Create today's entry only if it doesn't exist and today is a past date with missing workout
 * This only runs when we need to mark a missed workout for a past date
 */
export async function ensureTodaysEntry(userId: string): Promise<void> {
  const today = await getUserToday(userId)
  
  // Load all entries to check if today exists
  const allEntries = await loadAllUserEntries(userId)
  
  if (allEntries[today]) {
    console.log('✅ Today\'s entry already exists')
    return
  }
  
  // Only create an entry for today if it's a past date that should be marked as missed
  // For future dates, we calculate dynamically
  console.log('✅ No database entry needed - calendar will calculate dynamically')
}

/**
 * Get user's timezone and convert dates to their local timezone
 */
async function getUserToday(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single()
  
  const userTimezone = profile?.timezone || 'America/Chicago'
  return new Date().toLocaleDateString('en-CA', { timeZone: userTimezone })
}

/**
 * Calculate what workout should be on any given date based on completion history
 * Uses completion-based dynamic scheduling with dual cycle patterns
 * NOW WITH BULK LOADING - NO MORE INDIVIDUAL API CALLS!
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
  
  // Load all entries once (uses cache if already loaded)
  const allEntries = await loadAllUserEntries(userId)
  
  // Check if there's already an entry for this date
  const existingEntry = allEntries[targetDate]
  
  if (existingEntry) {
    const schedule = existingEntry.week_number <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    const dayInWeek = schedule.indexOf(existingEntry.workout_type as any)
    
    return {
      workoutType: existingEntry.workout_type as 'Push' | 'Pull' | 'Rest',
      week: existingEntry.week_number,
      status: existingEntry.status as 'completed' | 'scheduled' | 'missed',
      dayInWeek: dayInWeek >= 0 ? dayInWeek : 0
    }
  }
  
  // Get current program position based on completed workouts UP TO TODAY
  // This ensures we use the same baseline for all future date calculations
  const basePosition = await calculateCurrentProgramPosition(userId, today, allEntries)
  
  // For past dates and today, use the target date for position calculation
  if (targetDate <= today) {
    const position = await calculateCurrentProgramPosition(userId, targetDate, allEntries)
    const schedule = position.actualWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    const scheduledWorkout = schedule[position.sequencePosition]
    
    let status: 'completed' | 'missed' = 'missed'
    
    if (scheduledWorkout === 'Rest') {
      // Auto-mark Rest days as completed when they arrive
      status = 'completed'
      
      console.log(`🛋️ Auto-marking Rest day as completed for ${targetDate}`)
      
      const { error: insertError } = await supabase
        .from('daily_workout_log')
        .upsert({
          user_id: userId,
          date: targetDate,
          workout_type: 'Rest',
          status: 'completed',
          week_number: position.actualWeek
        }, { onConflict: 'user_id,date' })
      
      if (insertError) {
        throw new Error(`Failed to auto-mark Rest day for ${targetDate}: ${insertError.message}`)
      }
      
      // Invalidate cache since we just inserted data
      dbEntriesCache = null
      cacheUserId = null
    } else {
      // Check if there are exercises for this Push/Pull day
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
      workoutType: scheduledWorkout,
      week: position.actualWeek,
      status,
      dayInWeek: position.sequencePosition
    }
  }
  
  // Future date - calculate by advancing from today's position
  const todayDate = new Date(today)
  const targetDateObj = new Date(targetDate)
  const daysDifference = Math.floor((targetDateObj.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Start from today's position and advance
  let currentWeek = basePosition.actualWeek
  let currentPosition = basePosition.sequencePosition
  
  // Advance day by day to get the correct position
  for (let i = 0; i < daysDifference; i++) {
    currentPosition++
    
    // Determine the schedule for the current week
    const schedule = currentWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    
    // If we've completed a full week cycle, move to next week
    if (currentPosition >= schedule.length) {
      currentWeek++
      currentPosition = 0
    }
  }
  
  // Get the workout for this position
  const schedule = currentWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
  const scheduledWorkout = schedule[currentPosition]
  
  return {
    workoutType: scheduledWorkout,
    week: currentWeek,
    status: 'scheduled',
    dayInWeek: currentPosition
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
    
    // Invalidate cache since we just updated data
    dbEntriesCache = null
    cacheUserId = null
    
    // Update future scheduled workouts
    await updateFutureSchedule(userId, workoutDate)
    
    console.log('✅ Daily workout log updated successfully')
  } catch (error) {
    console.error('❌ Error updating daily workout log:', error)
    throw error
  }
}

/**
 * Mark rest day as completed
 */
export async function completeRestDay(userId: string, restDate?: string): Promise<void> {
  const dateToComplete = restDate || await getUserToday(userId)
  console.log(`🛋️ Marking rest day as completed for ${dateToComplete}`)
  
  try {
    // Mark rest day as completed
    const { error: updateError } = await supabase
      .from('daily_workout_log')
      .update({ 
        status: 'completed' 
      })
      .eq('user_id', userId)
      .eq('date', dateToComplete)
      .eq('workout_type', 'Rest')
    
    if (updateError) {
      console.error('Error completing rest day:', updateError)
      throw updateError
    }
    
    // Invalidate cache since we just updated data
    dbEntriesCache = null
    cacheUserId = null
    
    // Update future scheduled workouts
    await updateFutureSchedule(userId, dateToComplete)
    
    console.log('✅ Rest day completed and future schedule updated')
  } catch (error) {
    console.error('❌ Error completing rest day:', error)
    throw error
  }
}

/**
 * Calculate current program position based on actual workout completions
 * Handles dual cycle patterns:
 * - Weeks 1-4: Push-Pull-Rest-Push-Pull-Rest-Rest (break-in period)  
 * - Weeks 5+: Push-Pull-Push-Pull-Push-Pull-Rest (full intensity)
 * NOW USES CACHED DATA!
 */
async function calculateCurrentProgramPosition(
  userId: string, 
  upToDate: string, 
  allEntries?: Record<string, DailyWorkoutLogEntry>
): Promise<{
  actualWeek: number
  sequencePosition: number
  workoutsInCurrentWeek: number
}> {
  // Use provided entries or load them
  const entries = allEntries || await loadAllUserEntries(userId)
  
  // Filter for completed workouts up to specified date
  const completedWorkouts = Object.values(entries)
    .filter(entry => 
      entry.status === 'completed' && 
      entry.date <= upToDate &&
      entry.workout_type !== 'Missed'
    )
    .sort((a, b) => a.date.localeCompare(b.date))
  
  if (completedWorkouts.length === 0) {
    return { actualWeek: 1, sequencePosition: 0, workoutsInCurrentWeek: 0 }
  }
  
  let actualWeek = 1
  let sequencePosition = 0
  let workoutsInCurrentCycle = 0
  
  for (const workout of completedWorkouts) {
    const schedule = actualWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    const expectedType = schedule[sequencePosition]
    
    // For debugging - log the sequence validation
    if (workout.workout_type !== expectedType) {
      console.warn(`⚠️ Sequence mismatch: Expected ${expectedType} at position ${sequencePosition} of week ${actualWeek}, but found ${workout.workout_type} on ${workout.date}`)
      // Instead of throwing an error, let's try to self-correct
      // Find where this workout type should be in the current schedule
      const correctPosition = schedule.indexOf(workout.workout_type as any)
      if (correctPosition >= 0) {
        sequencePosition = correctPosition
      }
    }
    
    sequencePosition++
    workoutsInCurrentCycle++
    
    // Check if we completed a full cycle
    if (sequencePosition >= schedule.length) {
      actualWeek++
      sequencePosition = 0
      workoutsInCurrentCycle = 0
    }
  }
  
  return { actualWeek, sequencePosition, workoutsInCurrentWeek: workoutsInCurrentCycle }
}

/**
 * Delete all future scheduled entries and regenerate complete schedule
 */
async function regenerateCompleteSchedule(userId: string, fromDate: string): Promise<void> {
  console.log(`🔄 Regenerating complete schedule for user ${userId} from ${fromDate}`)
  
  // Get user's profile for start date
  const { data: profile } = await supabase
    .from('profiles')
    .select('x3_start_date')
    .eq('id', userId)
    .single()
  
  if (!profile?.x3_start_date) return
  
  // Calculate current program position
  const position = await calculateCurrentProgramPosition(userId, fromDate)
  console.log(`📍 Current position: Week ${position.actualWeek}, Position ${position.sequencePosition}, Workouts in week: ${position.workoutsInCurrentWeek}`)
  
  // Delete all future scheduled entries
  const { error: deleteError } = await supabase
    .from('daily_workout_log')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gt('date', fromDate)
  
  if (deleteError) {
    console.error('❌ Error deleting future scheduled entries:', deleteError)
    throw deleteError
  }
  
  // Invalidate cache since we just deleted data
  dbEntriesCache = null
  cacheUserId = null
  
  // Generate next 90 days of schedule entries
  const futureEntries: DailyWorkoutLogEntry[] = []
  const startDate = new Date(fromDate)
  startDate.setDate(startDate.getDate() + 1) // Start from tomorrow
  
  let currentWeek = position.actualWeek
  let currentSequencePosition = position.sequencePosition
  
  for (let i = 0; i < 90; i++) {
    const entryDate = new Date(startDate)
    entryDate.setDate(startDate.getDate() + i)
    const dateStr = entryDate.toISOString().split('T')[0]
    
    // Determine workout type based on current position
    const schedule = currentWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    const workoutType = schedule[currentSequencePosition]
    
    futureEntries.push({
      user_id: userId,
      date: dateStr,
      workout_type: workoutType,
      status: 'scheduled',
      week_number: currentWeek
    })
    
    // Advance sequence position
    currentSequencePosition++
    
    // If we completed a full 7-workout sequence, advance to next week
    if (currentSequencePosition >= 7) {
      currentSequencePosition = 0
      currentWeek++
    }
  }
  
  // Insert new future entries in batches
  const batchSize = 50
  for (let i = 0; i < futureEntries.length; i += batchSize) {
    const batch = futureEntries.slice(i, i + batchSize)
    
    const { error: insertError } = await supabase
      .from('daily_workout_log')
      .insert(batch)
    
    if (insertError) {
      console.error(`❌ Error inserting future schedule batch:`, insertError)
      throw insertError
    }
  }
  
  console.log(`✅ Generated ${futureEntries.length} future schedule entries`)
}

/**
 * Update future workout schedule based on what was completed today
 * Enhanced to regenerate complete future schedule with proper week integrity
 */
async function updateFutureSchedule(userId: string, completedDate: string): Promise<void> {
  console.log(`📅 Updating complete future schedule from ${completedDate}`)
  
  try {
    // Regenerate entire future schedule to ensure week integrity
    await regenerateCompleteSchedule(userId, completedDate)
    console.log('✅ Complete future schedule updated successfully')
  } catch (error) {
    console.error('❌ Error updating future schedule:', error)
    throw error
  }
}

/**
 * Mark missed workouts for past dates
 */
export async function markMissedWorkouts(userId: string): Promise<void> {
  const today = await getUserToday(userId)
  
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
  
  // Invalidate cache since we just updated data
  dbEntriesCache = null
  cacheUserId = null
  
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
  const today = await getUserToday(userId)
  
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
    
    sequencePosition++
    if (sequencePosition >= 7) {
      sequencePosition = 0
    }
  }
  
  // Invalidate cache since we just updated data
  dbEntriesCache = null
  cacheUserId = null
  
  console.log('✅ Program reset to Week 1')
}

/**
 * Get workout data for a specific date from the log
 */
export async function getWorkoutForDateFromLog(
  userId: string,
  date: string
): Promise<DailyWorkoutLogEntry | null> {
  const allEntries = await loadAllUserEntries(userId)
  return allEntries[date] || null
}

/**
 * Calculate streak from daily_workout_log
 */
export async function calculateStreakFromLog(userId: string): Promise<number> {
  const today = await getUserToday(userId)
  const { data: workouts, error } = await supabase
    .from('daily_workout_log')
    .select('*')
    .eq('user_id', userId)
    .lte('date', today)
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

/**
 * Backfill daily_workout_log for a user (client-safe version)
 */
export async function backfillDailyWorkoutLog(userId: string): Promise<void> {
  console.log(`👤 Processing user: ${userId}`)
  
  // Get user's start date
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('x3_start_date')
    .eq('id', userId)
    .single()
  
  if (profileError || !profile?.x3_start_date) {
    console.log(`⚠️ No start date found for user ${userId}, skipping...`)
    return
  }
  
  const startDate = new Date(profile.x3_start_date)
  console.log(`📅 Start date: ${profile.x3_start_date}`)
  
  // Get all workout exercises for this user
  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('workout_local_date_time, workout_type')
    .eq('user_id', userId)
    .order('workout_local_date_time', { ascending: true })
  
  if (exercisesError) {
    console.error(`❌ Error fetching exercises for user ${userId}:`, exercisesError)
    return
  }
  
  // Create a map of completed workout dates
  const completedWorkouts = new Map<string, 'Push' | 'Pull'>()
  exercises?.forEach(exercise => {
    const date = exercise.workout_local_date_time.split('T')[0]
    completedWorkouts.set(date, exercise.workout_type as 'Push' | 'Pull')
  })
  
  console.log(`💪 Found ${completedWorkouts.size} workout days`)
  
  // Process each day from start date to today
  const todayStr = await getUserToday(userId)
  const today = new Date(todayStr)
  const entries: DailyWorkoutLogEntry[] = []
  const currentDate = new Date(startDate)
  let consecutiveMisses = 0
  let actualWeek = 1
  
  // Track the workout sequence position
  let sequencePosition = 0
  
  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0]
    
    // Determine what should be scheduled based on the sequence
    const schedule = actualWeek <= 4 ? WEEK_1_4_SCHEDULE : WEEK_5_PLUS_SCHEDULE
    const scheduledWorkout = schedule[sequencePosition] as 'Push' | 'Pull' | 'Rest'
    
    // Check if workout was completed
    const completedWorkout = completedWorkouts.get(dateStr)
    
    let entry: DailyWorkoutLogEntry
    
    if (scheduledWorkout === 'Rest') {
      // Rest day
      entry = {
        user_id: userId,
        date: dateStr,
        workout_type: 'Rest',
        status: 'completed',
        week_number: actualWeek
      }
      consecutiveMisses = 0
      sequencePosition++
      
      // If we completed a full week (position >= 7), advance to next week
      if (sequencePosition >= 7) {
        sequencePosition = 0
        actualWeek++
      }
    } else if (completedWorkout) {
      // Workout was completed
      entry = {
        user_id: userId,
        date: dateStr,
        workout_type: completedWorkout,
        status: 'completed',
        week_number: actualWeek
      }
      consecutiveMisses = 0
      sequencePosition = (sequencePosition + 1) % 7
      
      // If we completed a full week (position 0), advance to next week
      if (sequencePosition === 0) {
        actualWeek++
      }
    } else {
      // Workout was missed (only for past dates)
      if (currentDate < today) {
        entry = {
          user_id: userId,
          date: dateStr,
          workout_type: 'Missed',
          status: 'completed',
          week_number: actualWeek
        }
        consecutiveMisses++
        
        // Check for 8-day reset rule
        if (consecutiveMisses >= 8) {
          console.log(`🔄 Reset triggered on ${dateStr} after ${consecutiveMisses} consecutive misses`)
          actualWeek = 1
          sequencePosition = 0
          consecutiveMisses = 0
        }
        // Don't advance sequence position for missed workouts
      } else {
        // Future date - scheduled workout
        entry = {
          user_id: userId,
          date: dateStr,
          workout_type: scheduledWorkout,
          status: 'scheduled',
          week_number: actualWeek
        }
        // Don't advance sequence for future dates
      }
    }
    
    entries.push(entry)
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  console.log(`📝 Generated ${entries.length} log entries`)
  
  // Insert entries in batches to avoid conflicts
  const batchSize = 100
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    
    const { error: insertError } = await supabase
      .from('daily_workout_log')
      .upsert(batch, { onConflict: 'user_id,date' })
    
    if (insertError) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError)
      throw insertError
    }
  }
  
  // Invalidate cache since we just inserted data
  dbEntriesCache = null
  cacheUserId = null
  
  console.log(`✅ Successfully backfilled ${entries.length} entries for user ${userId}`)
  
  // Special handling for Wayne's data before 7/30
  if (userId === 'a6fb2126-3a95-40b0-9f85-0e06e3de5a10') {
    console.log('🔧 Applying special handling for pre-7/30 data...')
    
    // Update all entries before 7/30 where workout_type is 'Missed' to 'Rest'
    const { error } = await supabase
      .from('daily_workout_log')
      .update({ workout_type: 'Rest' })
      .eq('user_id', userId)
      .eq('workout_type', 'Missed')
      .lt('date', '2025-07-30')
    
    if (error) {
      console.error('❌ Error updating pre-7/30 data:', error)
      throw error
    }
    
    console.log('✅ Pre-7/30 data updated successfully')
  }
}
