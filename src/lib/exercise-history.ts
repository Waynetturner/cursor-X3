import { supabase } from './supabase'

// Band hierarchy from X3 documentation: Ultra Light < White < Light Gray < Dark Gray < Black < Elite
const BAND_HIERARCHY = {
  'Ultra Light': 1,
  'White': 2,
  'Light Gray': 3,
  'Dark Gray': 4,
  'Black': 5,
  'Elite': 6
}

function getBandRank(bandColor: string): number {
  return BAND_HIERARCHY[bandColor as keyof typeof BAND_HIERARCHY] || 0
}

function getHighestBand(bandColors: string[]): string | null {
  if (bandColors.length === 0) return null
  return bandColors.reduce((highest, current) => {
    return getBandRank(current) > getBandRank(highest) ? current : highest
  })
}

export interface ExerciseHistoryData {
  exerciseName: string
  highestBand: string | null
  bestRepCount: number
  displayText: string
}

export async function getExerciseHistoryData(exerciseName: string): Promise<ExerciseHistoryData | null> {
  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return null
    }
    
    // Query all records for this exercise and user
    const { data: exerciseData, error } = await supabase
      .from('workout_exercises')
      .select('band_color, full_reps, partial_reps, workout_local_date_time, created_at_utc')
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)
      .order('created_at_utc', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return null
    }

    if (!exerciseData || exerciseData.length === 0) {
      // No history - return defaults
      return {
        exerciseName,
        highestBand: null,
        bestRepCount: 0,
        displayText: exerciseName.toUpperCase()
      }
    }

    // Extract all unique bands used
    const bandsUsed = [...new Set(exerciseData.map(record => record.band_color).filter(Boolean))]
    
    if (bandsUsed.length === 0) {
      return {
        exerciseName,
        highestBand: null,
        bestRepCount: 0,
        displayText: exerciseName.toUpperCase()
      }
    }
    
    // Find the highest band used
    const highestBand = getHighestBand(bandsUsed)
    
    if (!highestBand) {
      return {
        exerciseName,
        highestBand: null,
        bestRepCount: 0,
        displayText: exerciseName.toUpperCase()
      }
    }
    
    // Find the best rep count for that highest band
    const highestBandRecords = exerciseData.filter(record => record.band_color === highestBand)
    const bestRepCount = Math.max(...highestBandRecords.map(record => record.full_reps || 0))
    
    return {
      exerciseName,
      highestBand,
      bestRepCount,
      displayText: bestRepCount > 0 ? `${exerciseName.toUpperCase()} (${bestRepCount})` : exerciseName.toUpperCase()
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

// Get history data for all exercises in a workout
export async function getWorkoutHistoryData(exercises: string[]): Promise<Record<string, ExerciseHistoryData>> {
  const results: Record<string, ExerciseHistoryData> = {}
  
  for (const exercise of exercises) {
    const data = await getExerciseHistoryData(exercise)
    if (data) {
      results[exercise] = data
    }
  }
  
  return results
}
