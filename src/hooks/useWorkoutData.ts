'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, X3_EXERCISES, getTodaysWorkoutWithCompletion } from '@/lib/supabase'
import { getWorkoutHistoryData } from '@/lib/exercise-history'
import { testModeService } from '@/lib/test-mode'
import { getCurrentCentralISOString } from '@/lib/timezone'
import { announceToScreenReader } from '@/lib/accessibility'
import { updateDailyWorkoutLog } from '@/lib/daily-workout-log'
import { 
  AuthenticatedUser, 
  WorkoutInfo, 
  Exercise, 
  UseWorkoutDataReturn,
  WorkoutExerciseData,
  BandColor
} from '@/types/workout'

// Helper to get local ISO string with timezone offset
function getLocalISODateTime() {
  const timestamp = getCurrentCentralISOString()
  console.log('🕒 Generated Central timestamp:', timestamp)
  return timestamp
}

// Helper to format workout dates correctly without timezone conversion
function formatWorkoutDate(timestamp: string): string {
  const dateStr = timestamp.split('T')[0]
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const day = parseInt(parts[2])
    return `${month}/${day}/${year}`
  }
  
  return new Date(timestamp).toLocaleDateString()
}

export function useWorkoutData(): UseWorkoutDataReturn {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutInfo | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const router = useRouter()

  // Initialize user and workout data
  useEffect(() => {
    console.log('useWorkoutData: Initializing user and workout data')
    
    const getUser = async () => {
      console.log('🔍 Starting getUser function...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Auth error details:', authError)
        // Try to get session instead
        console.log('🔄 Trying to get session instead...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) {
          console.log('👤 No user found - redirecting to sign in')
          router.push('/auth/signin')
          return
        }
        console.log('✅ Found user via session:', session.user.id)
        setUser(session.user as AuthenticatedUser)
      }
      
      console.log('👤 User data:', user)
      
      if (user) {
        setUser(user as AuthenticatedUser)
        announceToScreenReader('Welcome to X3 Tracker. Loading your workout data.')
        
        // Get user's start date
        console.log('📊 Fetching user profile for ID:', user.id)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('x3_start_date')
          .eq('id', user.id)
          .single()
        
        console.log('📊 Profile data:', profile)
        console.log('❌ Profile error:', profileError)
        
        if (profileError) {
          console.error('❌ Error fetching profile:', profileError)
          // If profile doesn't exist, create one with today's date
          if (profileError.code === 'PGRST116') {
            console.log('🆕 Creating new profile with today as start date...')
            const today = (() => {
              const now = new Date()
              return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
            })()
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                x3_start_date: today
              })
            
            if (insertError) {
              console.error('❌ Error creating profile:', insertError)
            } else {
              console.log('✅ Profile created successfully')
              const workout = await getTodaysWorkoutWithCompletion(today, user.id)
              setTodaysWorkout(workout)
            }
          }
        } else if (profile?.x3_start_date) {
          console.log('✅ Found start date:', profile.x3_start_date)
          const workout = await getTodaysWorkoutWithCompletion(profile.x3_start_date, user.id)
          setTodaysWorkout(workout)
        } else {
          console.log('⚠️ No start date found in profile')
        }
      } else {
        console.log('👤 No user found')
        router.push('/auth/signin')
        return
      }
    }
    
    getUser()
  }, [router])

  // Setup exercises when workout is loaded
  useEffect(() => {
    if (user && todaysWorkout && todaysWorkout.workoutType !== 'Rest') {
      console.log('🏋️ Setting up exercises for workout type:', todaysWorkout.workoutType)
      setupExercises(todaysWorkout.workoutType as 'Push' | 'Pull')
      announceToScreenReader(`Today's ${todaysWorkout.workoutType} workout is ready. Week ${todaysWorkout.week}.`)
    } else if (user && todaysWorkout && todaysWorkout.workoutType === 'Rest') {
      announceToScreenReader(`Today is a rest day. Week ${todaysWorkout.week}.`)
    }
  }, [user, todaysWorkout])

  const setupExercises = async (workoutType: 'Push' | 'Pull') => {
    if (!user?.id) {
      console.log('No user ID available yet')
      return
    }
    
    console.log('🏋️ Setting up exercises with band hierarchy logic for:', workoutType, 'User ID:', user.id)
    
    const exerciseNames = X3_EXERCISES[workoutType]
    console.log('📋 Exercise names:', exerciseNames)
    
    // Get exercise history data for ALL exercises using our band hierarchy logic
    console.log('📊 Getting workout history data for all exercises...')
    const historyData = await getWorkoutHistoryData(exerciseNames, workoutType)
    console.log('📈 History data received:', historyData)
    
    // Get recent workout data for other fields (notes, dates, etc.)
    const { data: previousData, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_type', workoutType)
      .order('created_at_utc', { ascending: false })
      .limit(16)
    
    console.log('📋 Previous workout data for context:', previousData)
    console.log('❌ Query error:', error)
    
    // Create exercise data using recent workout data for input fields and historical best for display
    const exerciseData: Exercise[] = exerciseNames.map(name => {
      const history = historyData[name]
      
      console.log(`🎯 Processing ${name}:`)
      console.log(`  - History data:`, history)
      
      return {
        id: '',
        exercise_name: name,
        band_color: (history?.recentBand || 'White') as BandColor,
        full_reps: history?.recentFullReps || 0,
        partial_reps: history?.recentPartialReps || 0,
        notes: '',
        saved: false,
        previousData: null,
        workout_local_date_time: history?.recentWorkoutDate || '',
        // UI fields - name shows historical PR, input fields use recent data
        name: history?.displayText || name.toUpperCase(), // "CHEST PRESS (PR: 16)" or "CHEST PRESS"
        band: (history?.recentBand || 'White') as BandColor, // Pre-fill with recent band
        fullReps: history?.recentFullReps || 0, // Pre-fill with recent full reps
        partialReps: history?.recentPartialReps || 0, // Pre-fill with recent partial reps
        lastWorkout: history?.recentWorkoutDate ? `${history.recentFullReps}+${history.recentPartialReps} reps with ${history.recentBand} band` : '',
        lastWorkoutDate: history?.recentWorkoutDate ? formatWorkoutDate(history.recentWorkoutDate) : ''
      }
    })
    
    console.log('✅ Final exercise data with band hierarchy:', exerciseData)
    
    // Debug: Log what will be passed to ExerciseCard for each exercise
    exerciseData.forEach((exercise, index) => {
      console.log(`🔍 Exercise ${index} (${exercise.name}) will show in card:`)
      console.log(`  - Band: ${exercise.band} (from recent: ${historyData[exercise.exercise_name]?.recentBand})`)
      console.log(`  - Full Reps: ${exercise.fullReps} (from recent: ${historyData[exercise.exercise_name]?.recentFullReps})`)
      console.log(`  - Partial Reps: ${exercise.partialReps} (from recent: ${historyData[exercise.exercise_name]?.recentPartialReps})`)
    })
    
    setExercises(exerciseData)
    
    if (previousData && previousData.length > 0) {
      const lastWorkoutDate = formatWorkoutDate(previousData[0].workout_local_date_time)
      announceToScreenReader(`Previous ${workoutType} workout data loaded from ${lastWorkoutDate}`)
    }
    
    // Log success for each exercise
    exerciseData.forEach(exercise => {
      if (exercise.name.includes('PR:')) {
        console.log(`✨ ${exercise.exercise_name}: Display "${exercise.name}", Recent data - Band: ${exercise.band}, Reps: ${exercise.fullReps}+${exercise.partialReps}`)
      } else {
        console.log(`📝 ${exercise.exercise_name}: No history - Display "${exercise.name}", Default values`)
      }
    })
  }

  const updateExercise = (index: number, field: string, value: string | number | boolean) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value, saved: false }
    if (!newExercises[index].workout_local_date_time) {
      newExercises[index].workout_local_date_time = getLocalISODateTime()
    }
    setExercises(newExercises)

    // Announce changes to screen readers
    if (field === 'band') {
      announceToScreenReader(`${newExercises[index].name} band changed to ${value}`)
    } else if (field === 'fullReps' || field === 'partialReps') {
      announceToScreenReader(`${newExercises[index].name} ${field.replace('_', ' ')} set to ${value}`)
    }
  }

  const saveExercise = async (index: number) => {
    console.log('💾 Starting save for exercise index:', index)
    
    if (!user || !todaysWorkout) {
      console.error('❌ Missing user or todaysWorkout:', { user: !!user, todaysWorkout: !!todaysWorkout })
      throw new Error('Missing user or workout data. Please refresh the page.')
    }

    const exercise = exercises[index]
    console.log('🔍 Exercise object:', exercise)
    
    // Always use current timestamp to avoid duplicates
    const workoutLocalDateTime = getLocalISODateTime()
    console.log('🕒 Using fresh timestamp:', workoutLocalDateTime)
    
    console.log('📊 Exercise data to save:', exercise)
    console.log('🕒 Workout time:', workoutLocalDateTime)
    console.log('👤 User ID:', user.id)
    console.log('🏋️ Workout type:', todaysWorkout.workoutType)
    console.log('📈 Week number:', todaysWorkout.week)

    announceToScreenReader('Saving exercise data...', 'assertive')

    const dataToSave: WorkoutExerciseData = {
      user_id: user.id,
      workout_local_date_time: workoutLocalDateTime,
      workout_type: todaysWorkout.workoutType as 'Push' | 'Pull',
      week_number: todaysWorkout.week,
      exercise_name: exercise.exercise_name,
      band_color: exercise.band,
      full_reps: exercise.fullReps,
      partial_reps: exercise.partialReps,
      notes: exercise.notes
    }
    
    console.log('💾 Data being sent to Supabase:', dataToSave)

    console.log('🎯 About to save workout data...')
    
    let data, error
    
    // Check if test mode is enabled
    if (testModeService.shouldMockWorkouts()) {
      console.log('🧪 Test Mode: Intercepting workout save, adding to mock data')
      
      // Add to mock workout data
      testModeService.addMockWorkout({
        date: workoutLocalDateTime.split('T')[0],
        workout_type: todaysWorkout.workoutType as 'Push' | 'Pull',
        exercises: [{
          exercise_name: exercise.exercise_name,
          band_color: exercise.band,
          full_reps: exercise.fullReps,
          partial_reps: exercise.partialReps
        }]
      })
      
      // Simulate successful response for test mode
      data = [{ ...dataToSave, id: `test-${Date.now()}` }]
      error = null
      
      console.log('🧪 Test Mode: Mock save successful')
    } else {
      // First, let's see what records already exist for this user/exercise
      const { data: existingRecords, error: checkError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_name', exercise.exercise_name)
        .order('created_at_utc', { ascending: false })
        .limit(3)
      
      console.log('🔍 Existing records for this exercise:', existingRecords)
      console.log('🔍 Check error:', checkError)
      
      // Try a simple insert with fresh timestamp
      console.log('🚀 Attempting insert operation with fresh timestamp...')
      const result = await supabase
        .from('workout_exercises')
        .insert(dataToSave)
        .select()
      
      data = result.data
      error = result.error
    }

    console.log('📤 Supabase response data:', data)
    console.log('❌ Supabase error:', error)
    
    if (!error) {
      const newExercises = [...exercises]
      newExercises[index].saved = true
      setExercises(newExercises)
      setRefreshTrigger(prev => prev + 1) // Trigger workout history refresh
      console.log('✅ Exercise saved successfully!')
      announceToScreenReader(`${exercise.name} saved successfully!`, 'assertive')
      
      // Update daily workout log if this is the last exercise
      const isLastExercise = index + 1 >= exercises.length
      if (isLastExercise) {
        console.log('📊 Updating daily workout log for completed workout')
        try {
          await updateDailyWorkoutLog(
            user.id,
            workoutLocalDateTime.split('T')[0], // Just the date part
            todaysWorkout.workoutType as 'Push' | 'Pull'
          )
          console.log('✅ Daily workout log updated successfully')
        } catch (logError) {
          console.error('❌ Error updating daily workout log:', logError)
          // Don't fail the exercise save if log update fails
        }
      }
    } else {
      console.error('❌ Error saving exercise:', error)
      
      let errorMessage = 'Unknown error occurred. Please try again.'
      if (error) {
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Create user-friendly error message
        if (error.code === 'PGRST116') {
          errorMessage = 'No database connection. Please check your internet connection.'
        } else if (error.message?.includes('duplicate')) {
          errorMessage = 'This exercise has already been saved for today.'
        } else if (error.message?.includes('permission')) {
          errorMessage = 'Permission denied. Please sign out and back in.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        announceToScreenReader(`Error saving exercise: ${errorMessage}`, 'assertive')
      } else {
        console.error('❌ Unknown error occurred')
        announceToScreenReader('Unknown error saving exercise. Please try again.', 'assertive')
      }
      
      throw new Error(errorMessage)
    }
  }

  const retrySaveExercise = (index: number) => {
    console.log('🔄 Retrying save for exercise index:', index)
    return saveExercise(index)
  }

  return {
    user,
    todaysWorkout,
    exercises,
    refreshTrigger,
    setupExercises,
    updateExercise,
    saveExercise,
    retrySaveExercise
  }
}