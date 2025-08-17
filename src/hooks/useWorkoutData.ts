
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, X3_EXERCISES } from '@/lib/supabase'
import { getWorkoutHistoryData } from '@/lib/exercise-history'
import { DataTransformer } from '@/utils/data-transformers'
import { testModeService } from '@/lib/test-mode'
import { announceToScreenReader } from '@/lib/accessibility'
import { updateDailyWorkoutLog, getTodaysWorkoutFromLog, getUserToday, completeRestDay } from '@/lib/daily-workout-log'
import { 
  AuthenticatedUser, 
  WorkoutInfo, 
  Exercise, 
  UseWorkoutDataReturn,
  WorkoutExerciseData,
  BandColor
} from '@/types/workout'

// Helper to get local ISO string with timezone offset
async function getLocalISODateTime(userId: string) {
  // Get user's timezone from profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
  
  if (!profiles || profiles.length === 0 || !profiles[0].timezone) {
    throw new Error('User timezone not found in profile. Please set your timezone in settings.')
  }
  
  const userTimezone = profiles[0].timezone
  
  // Create current time in user's timezone
  const now = new Date()
  const timestamp = now.toLocaleString('sv-SE', { timeZone: userTimezone }) + 'Z'
  console.log('🕒 Generated user timezone timestamp:', timestamp, 'for timezone:', userTimezone)
  return timestamp
}

export function useWorkoutData(): UseWorkoutDataReturn {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutInfo | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const router = useRouter()

  // Build exercise list for the given workout type using history + recent data
  const setupExercises = useCallback(async (workoutType: 'Push' | 'Pull') => {
    if (!user?.id) {
      console.log('No user ID available yet')
      return
    }

    console.log('🏋️ Setting up exercises with band hierarchy logic for:', workoutType, 'User ID:', user.id)

    const exerciseNames = X3_EXERCISES[workoutType]
    const historyData = await getWorkoutHistoryData(exerciseNames, workoutType)

    const { data: previousData, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_type', workoutType)
      .order('created_at_utc', { ascending: false })
      .limit(16)

    console.log('📋 Previous workout data for context:', previousData)
    console.log('❌ Query error:', error)

    const exerciseData: Exercise[] = exerciseNames.map(name => {
      const history = historyData[name]
      return {
        id: '',
        exercise_name: name,
        band_color: (history?.recentBand || 'White') as BandColor,
        full_reps: history?.recentFullReps || 0,
        partial_reps: history?.recentPartialReps || 0,
        notes: '',
        saved: false,
        previousData: undefined,
        workout_local_date_time: history?.recentWorkoutDate || '',
        // UI fields - name shows historical PR, input fields use recent data
        name: history?.displayText || name.toUpperCase(),
        band: (history?.recentBand || 'White') as BandColor,
        fullReps: history?.recentFullReps || 0,
        partialReps: history?.recentPartialReps || 0,
        lastWorkout: history?.recentWorkoutDate ? `${history.recentFullReps}+${history.recentPartialReps} reps with ${history.recentBand} band` : '',
  lastWorkoutDate: history?.recentWorkoutDate ? DataTransformer.formatWorkoutDate(history.recentWorkoutDate) : ''
      }
    })

    setExercises(exerciseData)

    if (previousData && previousData.length > 0) {
  const lastWorkoutDate = DataTransformer.formatWorkoutDate(previousData[0].workout_local_date_time)
      announceToScreenReader(`Previous ${workoutType} workout data loaded from ${lastWorkoutDate}`)
    }
  }, [user?.id])

  // Initialize user once
  useEffect(() => {
    let didCancel = false

    const initUser = async () => {
      console.log('🚀 Initializing user...')
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('❌ Auth error details:', authError)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError || !session?.user) {
            console.log('👤 No user found - redirecting to sign in')
            if (!didCancel) router.push('/auth/signin')
            return
          }
          console.log('✅ Found user via session:', session.user.id)
          if (!didCancel) setUser(session.user as AuthenticatedUser)
          return
        }

        console.log('👤 User data:', user)
        if (user && !didCancel) {
          setUser(user as AuthenticatedUser)
          announceToScreenReader('Welcome to X3 Tracker. Loading your workout data.')
        }
      } catch (e) {
        console.error('❌ Error during user init:', e)
      }
    }

    initUser()

    return () => {
      didCancel = true
    }
  }, [router])

  // Load today's workout when user or refreshTrigger changes
  useEffect(() => {
    let didCancel = false
    const loadToday = async () => {
      if (!user?.id) return
      try {
        const workout = await getTodaysWorkoutFromLog(user.id)
        if (!didCancel) {
          if (workout) {
            const mapped: WorkoutInfo = {
              week: workout.week,
              workoutType: workout.workoutType,
              dayInWeek: workout.dayInWeek,
              status: workout.status === 'scheduled' ? 'scheduled' : 'current',
              missedWorkouts: 0,
            }
            setTodaysWorkout(mapped)
          } else {
            setTodaysWorkout(null)
          }
        }
      } catch (e) {
        console.error('❌ Error loading today\'s workout:', e)
      }
    }

    loadToday()

    return () => {
      didCancel = true
    }
  }, [user?.id, refreshTrigger])

  // Setup exercises when we have a non-Rest workout
  useEffect(() => {
    if (!user || !todaysWorkout) return
    if (todaysWorkout.workoutType !== 'Rest') {
      console.log('🏋️ Setting up exercises for workout type:', todaysWorkout.workoutType)
      setupExercises(todaysWorkout.workoutType as 'Push' | 'Pull')
      if (typeof announceToScreenReader === 'function') {
        announceToScreenReader(`Today's ${todaysWorkout.workoutType} workout is ready. Week ${todaysWorkout.week}.`)
      }
    } else {
      if (typeof announceToScreenReader === 'function') {
        announceToScreenReader(`Today is a rest day. Week ${todaysWorkout.week}.`, 'polite')
      }
      // Log rest day in daily_workout_log if not already present
      (async () => {
        const userToday = await getUserToday(user.id)
        const { data: existingEntry } = await supabase
          .from('daily_workout_log')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', userToday)
          .eq('workout_type', 'Rest')
          .eq('status', 'completed')
          .single()
        if (!existingEntry) {
          await completeRestDay(user.id, userToday)
          console.log('✅ Rest day logged in daily_workout_log:', userToday)
        }
      })()
    }
  }, [user, todaysWorkout, setupExercises])
  const updateExercise = async (index: number, field: string, value: string | number | boolean) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value, saved: false }
    if (!newExercises[index].workout_local_date_time && user?.id) {
      newExercises[index].workout_local_date_time = await getLocalISODateTime(user.id)
    }
    setExercises(newExercises)

    // Announce changes to screen readers
    if (field === 'band') {
      announceToScreenReader(`${newExercises[index].name} band changed to ${value}`)
    } else if (field === 'fullReps' || field === 'partialReps') {
      announceToScreenReader(`${newExercises[index].name} ${field.replace('_', ' ')} set to ${value}`)
    }
  }

  // Success handler for exercise save
  async function handleSuccessfulExerciseSave(
    index: number,
    exercise: Exercise,
    exercises: Exercise[],
    user: AuthenticatedUser,
    todaysWorkout: WorkoutInfo,
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>,
    setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>
  ) {
    const newExercises = [...exercises];
    newExercises[index].saved = true;
    setExercises(newExercises);
    setRefreshTrigger(prev => prev + 1); // Trigger workout history refresh
    console.log('✅ Exercise saved successfully!');
    announceToScreenReader(`${exercise.name} saved successfully!`, 'assertive');

    // Check if ALL exercises are now saved
    const allExercisesSaved = newExercises.every(ex => ex.saved);
    if (allExercisesSaved) {
      console.log('📊 All exercises completed - updating daily workout log immediately');
      try {
        const userToday = await getUserToday(user.id);
        console.log('🕒 Using user local date for workout log:', userToday);
        await updateDailyWorkoutLog(
          user.id,
          userToday,
          todaysWorkout.workoutType as 'Push' | 'Pull'
        );
        console.log('✅ Daily workout log updated successfully (calendar will update now)');
      } catch (logError) {
        console.error('❌ Error updating daily workout log:', logError);
        // Don't fail the exercise save if log update fails
      }
    } else {
      const savedCount = newExercises.filter(ex => ex.saved).length;
      console.log(`📊 Exercise ${savedCount}/${exercises.length} saved - waiting for all exercises to complete`);
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
    const workoutLocalDateTime = await getLocalISODateTime(user.id)
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
      await handleSuccessfulExerciseSave(
        index,
        exercise,
        exercises,
        user,
        todaysWorkout,
        setExercises,
        setRefreshTrigger
      );
      return;
    }

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
