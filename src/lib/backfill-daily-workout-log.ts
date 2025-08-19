import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Read from .env.local if environment variables not set
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value && !process.env[key]) {
        process.env[key] = value.trim()
      }
    })
  }
}

loadEnvFile()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kqgudwgxxggslmurmfgt.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZ3Vkd2d4eGdnc2xtdXJtZmd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQzOTA0MiwiZXhwIjoyMDY0MDE1MDQyfQ.Ke-dfu6oIr3iAok6Ri0N9ugrr-szy2IO1w8B5Ghwi7o'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface DailyWorkoutLogEntry {
  user_id: string
  date: string
  workout_type: 'Push' | 'Pull' | 'Rest' | 'Missed'
  status: 'completed' | 'scheduled'
  week_number: number
}

// X3 workout schedules
const WEEK_1_4_SCHEDULE = ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest'] as const
const WEEK_5_PLUS_SCHEDULE = ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest'] as const

export async function backfillDailyWorkoutLog(userId?: string) {
  console.log('🚀 Starting daily_workout_log backfill...')
  
  try {
    // Get all users or specific user
    let userIds: string[] = []
    
    if (userId) {
      userIds = [userId]
    } else {
      // Get all users with workout data
      const { data: users, error } = await supabase
        .from('workout_exercises')
        .select('user_id')
        .neq('user_id', null)
      
      if (error) throw error
      
      userIds = [...new Set(users?.map(u => u.user_id) || [])]
    }
    
    console.log(`📊 Processing ${userIds.length} users...`)
    
    for (const uid of userIds) {
      await backfillUserWorkoutLog(uid)
    }
    
    console.log('✅ Backfill completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during backfill:', error)
    throw error
  }
}

async function backfillUserWorkoutLog(userId: string) {
  console.log(`\n👤 Processing user: ${userId}`)
  
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
  const today = new Date()
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
      sequencePosition = (sequencePosition + 1) % 7
      
      // If we completed a full week (position 0), advance to next week
      if (sequencePosition === 0) {
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
  
  console.log(`✅ Successfully backfilled ${entries.length} entries for user ${userId}`)
  
  // Log some sample entries for verification
  console.log('\n📋 Sample entries:')
  const sampleDates = ['2025-07-30', '2025-08-03', '2025-08-05', '2025-08-06']
  entries
    .filter(e => sampleDates.includes(e.date))
    .forEach(e => {
      console.log(`  ${e.date}: ${e.workout_type} (${e.status}) - Week ${e.week_number}`)
    })
}

// Special handling for Wayne's data before 7/30
export async function backfillWayneSpecialCase(userId: string) {
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

// CLI execution
if (require.main === module) {
  const userId = process.argv[2]
  
  backfillDailyWorkoutLog(userId)
    .then(() => {
      if (userId) {
        // Apply special case for Wayne's data
        return backfillWayneSpecialCase(userId)
      }
    })
    .then(() => {
      console.log('\n🎉 Backfill process completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Backfill process failed:', error)
      process.exit(1)
    })
}
