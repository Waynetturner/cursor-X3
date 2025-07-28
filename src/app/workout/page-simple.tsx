'use client'

import { useState, useEffect } from 'react'
import { supabase, getTodaysWorkout, X3_EXERCISES } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { getCurrentCentralISOString } from '@/lib/timezone'
import ExerciseCard from '@/components/ExerciseCard'
import { getWorkoutHistoryData } from '@/lib/exercise-history'

interface Exercise {
  id?: string
  exercise_name: string
  band_color: string
  full_reps: number
  partial_reps: number
  notes: string
  saved: boolean
  workout_local_date_time: string
  // UI fields
  name: string
  band: string
  fullReps: number
  partialReps: number
  lastWorkout: string
  lastWorkoutDate: string
}

export default function SimplifiedWorkoutPage() {
  const [user, setUser] = useState<any>(null)
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Helper to format workout dates
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

  // Initialize user and workout data
  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/signin')
          return
        }

        setUser(user)

        // Get user profile for start date
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('x3_start_date')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Create profile with today's date if it doesn't exist
          const today = new Date().toISOString().split('T')[0]
          await supabase.from('profiles').insert({
            id: user.id,
            x3_start_date: today
          })
          const workout = getTodaysWorkout(today)
          setTodaysWorkout(workout)
        } else if (profile?.x3_start_date) {
          const workout = getTodaysWorkout(profile.x3_start_date)
          setTodaysWorkout(workout)
        }

      } catch (error) {
        console.error('Error initializing workout:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeWorkout()
  }, [router])

  // Setup exercises when workout is ready
  useEffect(() => {
    if (user && todaysWorkout && todaysWorkout.workoutType !== 'Rest') {
      setupExercises(todaysWorkout.workoutType as 'Push' | 'Pull')
    }
  }, [user, todaysWorkout])

  const setupExercises = async (workoutType: 'Push' | 'Pull') => {
    if (!user?.id) return

    const exerciseNames = X3_EXERCISES[workoutType]
    
    // Get exercise history data
    const historyData = await getWorkoutHistoryData(exerciseNames)
    
    // Create simplified exercise data
    const exerciseData = exerciseNames.map(name => {
      const history = historyData[name]
      
      return {
        id: '',
        exercise_name: name,
        band_color: (history?.recentBand || 'White') as any,
        full_reps: history?.recentFullReps || 0,
        partial_reps: history?.recentPartialReps || 0,
        notes: '',
        saved: false,
        workout_local_date_time: history?.recentWorkoutDate || '',
        // UI fields
        name: history?.displayText || name.toUpperCase(),
        band: (history?.recentBand || 'White') as any,
        fullReps: history?.recentFullReps || 0,
        partialReps: history?.recentPartialReps || 0,
        lastWorkout: history?.recentWorkoutDate ? 
          `${history.recentFullReps}+${history.recentPartialReps} reps with ${history.recentBand} band` : '',
        lastWorkoutDate: history?.recentWorkoutDate ? formatWorkoutDate(history.recentWorkoutDate) : ''
      }
    })
    
    setExercises(exerciseData)
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const newExercises = [...exercises]
    newExercises[index] = { 
      ...newExercises[index], 
      [field]: value, 
      saved: false,
      workout_local_date_time: newExercises[index].workout_local_date_time || getCurrentCentralISOString()
    }
    setExercises(newExercises)
  }

  const saveExercise = async (index: number) => {
    if (!user || !todaysWorkout) return

    const exercise = exercises[index]
    const workoutLocalDateTime = getCurrentCentralISOString()
    
    const dataToSave = {
      user_id: user.id,
      workout_local_date_time: workoutLocalDateTime,
      workout_type: todaysWorkout.workoutType,
      week_number: todaysWorkout.week,
      exercise_name: exercise.exercise_name,
      band_color: exercise.band,
      full_reps: exercise.fullReps,
      partial_reps: exercise.partialReps,
      notes: exercise.notes
    }

    try {
      const { error } = await supabase
        .from('workout_exercises')
        .insert(dataToSave)

      if (!error) {
        const newExercises = [...exercises]
        newExercises[index].saved = true
        setExercises(newExercises)
      } else {
        console.error('Error saving exercise:', error)
      }
    } catch (error) {
      console.error('Error saving exercise:', error)
    }
  }

  // Navigation handlers
  const handleStartExercise = () => router.push('/workout')
  const handleLogWorkout = () => router.push('/workout')
  const handleAddGoal = () => router.push('/goals')
  const handleScheduleWorkout = () => router.push('/calendar')
  const handleViewStats = () => router.push('/stats')

  if (loading) {
    return (
      <AppLayout 
        onStartExercise={handleStartExercise}
        onLogWorkout={handleLogWorkout}
        onAddGoal={handleAddGoal}
        onScheduleWorkout={handleScheduleWorkout}
        onViewStats={handleViewStats}
        exerciseInProgress={false}
        workoutCompleted={false}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="brand-card text-center">
            <h2 className="text-subhead brand-gold mb-4">Loading Workout...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <AppLayout 
      onStartExercise={handleStartExercise}
      onLogWorkout={handleLogWorkout}
      onAddGoal={handleAddGoal}
      onScheduleWorkout={handleScheduleWorkout}
      onViewStats={handleViewStats}
      exerciseInProgress={false}
      workoutCompleted={false}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Workout Header */}
        <div className="brand-card text-center mb-8">
          {todaysWorkout?.workoutType === 'Rest' ? (
            <>
              <h1 className="text-headline mb-2">
                <span className="brand-fire">Rest</span> <span className="brand-ember">Day</span>
              </h1>
              <p className="text-body text-secondary">Week {todaysWorkout.week} - Recovery Day</p>
              <p className="text-body-small text-secondary mt-2">Take time to recover and prepare for your next workout</p>
            </>
          ) : (
            <>
              <h1 className="text-headline mb-2">
                <span className="brand-fire">{todaysWorkout?.workoutType}</span> <span className="brand-ember">Workout</span>
              </h1>
              <p className="text-body text-secondary">Week {todaysWorkout?.week}</p>
            </>
          )}
        </div>

        {/* Exercise Cards */}
        {todaysWorkout?.workoutType !== 'Rest' && exercises.length > 0 && (
          <div className="space-y-6">
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.exercise_name}
                exercise={exercise}
                onUpdate={(field, value) => updateExercise(index, field, value)}
                onSave={() => saveExercise(index)}
                isLoading={false}
                saveError={null}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}