import { supabase } from './supabase'

// Band hierarchy from X3 documentation: Ultra Light < White < Light Gray < Dark Gray < Black < Elite
// DO NOT DELETE: This hierarchy is essential for calculating true personal bests
// A PR with Dark Gray band is better than a higher rep count with White band
const BAND_HIERARCHY = {
  'Ultra Light': 1,
  'White': 2,
  'Light Gray': 3,
  'Dark Gray': 4,
  'Black': 5,
  'Elite': 6
}

// DO NOT DELETE: Used to determine band strength ranking for PR calculations
function getBandRank(bandColor: string): number {
  return BAND_HIERARCHY[bandColor as keyof typeof BAND_HIERARCHY] || 0
}

// DO NOT DELETE: Finds the strongest band used across all workouts
function getHighestBand(bandColors: string[]): string | null {
  if (bandColors.length === 0) return null
  return bandColors.reduce((highest, current) => {
    return getBandRank(current) > getBandRank(highest) ? current : highest
  })
}

export interface ExerciseHistoryData {
  exerciseName: string
  // Recent workout data for pre-filling input fields
  recentBand: string | null
  recentFullReps: number
  recentPartialReps: number
  recentWorkoutDate: string | null
  // Historical best for display in exercise name
  bestFullReps: number
  displayText: string
}

export async function getExerciseHistoryData(exerciseName: string, workoutType?: 'Push' | 'Pull'): Promise<ExerciseHistoryData | null> {
  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return null
    }
    
    console.log(`🔍 [${exerciseName}] Querying exercise history for user:`, user.id, 'workout type:', workoutType)
    
    // We need all data to calculate the true personal best, but will use recent data for input fields
    // Using created_at_utc instead of workout_local_date_time for consistency
    const { data: exerciseData, error } = await supabase
      .from('workout_exercises')
      .select('band_color, full_reps, partial_reps, created_at_utc, workout_type')
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)
      .order('created_at_utc', { ascending: false })

    console.log(`🔍 [${exerciseName}] Raw query results:`, exerciseData)
    console.log(`🔍 [${exerciseName}] Query error:`, error)

    if (error) {
      console.error('Database error:', error)
      return null
    }

    if (!exerciseData || exerciseData.length === 0) {
      console.log(`🔍 [${exerciseName}] No history found - returning defaults`)
      // No history - return defaults
      return {
        exerciseName,
        recentBand: null,
        recentFullReps: 0,
        recentPartialReps: 0,
        recentWorkoutDate: null,
        bestFullReps: 0,
        displayText: exerciseName.toUpperCase()
      }
    }

    // Log the first few records to see the order
    console.log(`🔍 [${exerciseName}] First 3 records by date:`)
    exerciseData.slice(0, 3).forEach((record: any, index: number) => {
      console.log(`  ${index}: ${record.created_at_utc} - ${record.full_reps}+${record.partial_reps} reps (${record.band_color}) [${record.workout_type}]`)
    })

    // Get most recent workout data for pre-filling input fields
    // If workoutType is specified, filter to get the most recent record for that workout type
    let mostRecentRecord = exerciseData[0]
    if (workoutType) {
      const workoutTypeRecords = exerciseData.filter((record: any) => record.workout_type === workoutType)
      if (workoutTypeRecords.length > 0) {
        mostRecentRecord = workoutTypeRecords[0]
        console.log(`🔍 [${exerciseName}] Found ${workoutTypeRecords.length} records for ${workoutType} workouts`)
        console.log(`🔍 [${exerciseName}] Most recent ${workoutType} record:`, mostRecentRecord)
      } else {
        console.log(`🔍 [${exerciseName}] No records found for ${workoutType} workouts, using most recent overall`)
      }
    }
    console.log(`🔍 [${exerciseName}] Using most recent record:`, mostRecentRecord)
    
    // Find TRUE personal best: highest full reps achieved with the highest band
    const bandsUsed = [...new Set(exerciseData.map((record: any) => record.band_color).filter(Boolean))] as string[]
    let bestFullReps = 0
    
    if (bandsUsed.length > 0) {
      const highestBand = getHighestBand(bandsUsed)
      if (highestBand) {
        // Find the best full reps achieved with the highest band
        const highestBandRecords = exerciseData.filter((record: any) => record.band_color === highestBand)
        bestFullReps = Math.max(...highestBandRecords.map((record: any) => record.full_reps || 0))
      }
    }
    
    return {
      exerciseName,
      recentBand: mostRecentRecord.band_color,
      recentFullReps: mostRecentRecord.full_reps || 0,
      recentPartialReps: mostRecentRecord.partial_reps || 0,
      recentWorkoutDate: mostRecentRecord.created_at_utc,
      bestFullReps,
      displayText: bestFullReps > 0 
        ? `${exerciseName.toUpperCase()} (${bestFullReps})` 
        : exerciseName.toUpperCase()
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Get history data for all exercises in a workout
export async function getWorkoutHistoryData(exercises: string[], workoutType?: 'Push' | 'Pull'): Promise<Record<string, ExerciseHistoryData>> {
  const results: Record<string, ExerciseHistoryData> = {}
  
  for (const exercise of exercises) {
    const data = await getExerciseHistoryData(exercise, workoutType)
    if (data) {
      results[exercise] = data
    }
  }
  
  return results
}