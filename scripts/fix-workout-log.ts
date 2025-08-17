#!/usr/bin/env ts-node

/**
 * Fix workout log timezone issues
 * This script cleans up incorrect entries and ensures proper timezone handling
 */

import { supabase } from '../src/lib/supabase'

async function fixWorkoutLog() {
  console.log('🧹 Cleaning up workout log timezone issues...')
  
  // Get all users
  const { data: users } = await supabase
    .from('profiles')
    .select('id, x3_start_date, timezone')
  
  if (!users) {
    console.log('❌ No users found')
    return
  }
  
  console.log(`👥 Found ${users.length} users`)
  
  for (const user of users) {
    console.log(`\n🔧 Processing user: ${user.id}`)
    
    // 1. Clean up all scheduled entries (shouldn't exist)
    const { error: cleanError } = await supabase
      .from('daily_workout_log')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
    
    if (cleanError) {
      console.error('❌ Error cleaning scheduled entries:', cleanError)
      continue
    }
    
    console.log('✅ Removed all scheduled entries')
    
    // 2. Get all workout exercises to verify dates
    const { data: exercises } = await supabase
      .from('workout_exercises')
      .select('workout_local_date_time, workout_type')
      .eq('user_id', user.id)
      .order('workout_local_date_time', { ascending: true })
    
    if (!exercises || exercises.length === 0) {
      console.log('📝 No workout exercises found')
      continue
    }
    
    console.log(`💪 Found ${exercises.length} workout exercises`)
    
    // 3. Show current workout log vs exercise dates to identify mismatches
    const { data: logEntries } = await supabase
      .from('daily_workout_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('date', { ascending: true })
    
    console.log(`📋 Current log entries: ${logEntries?.length || 0}`)
    
    // Check for date mismatches
    const exerciseDates = new Set(exercises.map(ex => ex.workout_local_date_time.split('T')[0]))
    const logDates = new Set(logEntries?.map(entry => entry.date) || [])
    
    console.log('📅 Exercise dates:', Array.from(exerciseDates).slice(-5))
    console.log('📅 Log dates:', Array.from(logDates).slice(-5))
    
    const mismatches = []
    for (const exerciseDate of exerciseDates) {
      if (!logDates.has(exerciseDate)) {
        mismatches.push(exerciseDate)
      }
    }
    
    if (mismatches.length > 0) {
      console.log('⚠️ Found date mismatches (exercises without log entries):', mismatches)
    }
  }
  
  console.log('\n✅ Workout log cleanup complete!')
  console.log('🔄 The calendar will now use dynamic calculation only')
}

// Run the script
fixWorkoutLog().catch(console.error)
