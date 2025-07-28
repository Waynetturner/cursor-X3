'use client'

import { useState, useEffect } from 'react'
import { supabase, getTodaysWorkout, X3_EXERCISES } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { getCurrentCentralISOString } from '@/lib/timezone'
import ExerciseCard from '@/components/ExerciseCard'
import CadenceButton from '@/components/CadenceButton'
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

// Simple beep function
function playBeep() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  const ctx = new AudioCtx()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  gain.gain.value = 0.1
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.1)
  oscillator.onended = () => ctx.close()
}

export default function StreamlinedWorkoutPage() {
  const [user, setUser] = useState<any>(null)
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  
  // Core workout flow states
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [exerciseStates, setExerciseStates] = useState<{ [key: number]: 'idle' | 'active' | 'completed' }>({})
  
  // Cadence system
  const [cadenceActive, setCadenceActive] = useState(false)
  const [cadenceInterval, setCadenceInterval] = useState<NodeJS.Timeout | null>(null)
  
  // Rest timer system
  const [restTimer, setRestTimer] = useState<{ active: boolean; timeLeft: number; forExercise: number } | null>(null)
  const [restInterval, setRestInterval] = useState<NodeJS.Timeout | null>(null)
  
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
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/signin')
          return
        }

        setUser(user)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('x3_start_date')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
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

  // Cadence system - metronome beeping
  useEffect(() => {
    if (cadenceInterval) {
      clearInterval(cadenceInterval)
      setCadenceInterval(null)
    }

    if (cadenceActive) {
      playBeep() // Play immediately
      const interval = setInterval(() => {
        playBeep()
      }, 2000) // Every 2 seconds
      setCadenceInterval(interval)
    }

    return () => {
      if (cadenceInterval) {
        clearInterval(cadenceInterval)
      }
    }
  }, [cadenceActive])

  // Rest timer system
  useEffect(() => {
    if (restInterval) {
      clearInterval(restInterval)
      setRestInterval(null)
    }

    if (restTimer?.active && restTimer.timeLeft > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => {
          if (!prev || prev.timeLeft <= 1) {
            // Timer finished - auto-start next exercise
            const nextIndex = prev?.forExercise + 1
            if (nextIndex < exercises.length) {
              startExercise(nextIndex)
            }
            return null
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
      setRestInterval(interval)
    }

    return () => {
      if (restInterval) {
        clearInterval(restInterval)
      }
    }
  }, [restTimer?.active, exercises.length])

  const setupExercises = async (workoutType: 'Push' | 'Pull') => {
    if (!user?.id) return

    const exerciseNames = X3_EXERCISES[workoutType]
    const historyData = await getWorkoutHistoryData(exerciseNames)
    
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

  const startExercise = (index: number) => {
    setCurrentExerciseIndex(index)
    setExerciseStates(prev => ({ ...prev, [index]: 'active' }))
    
    // Start cadence automatically
    if (!cadenceActive) {
      setCadenceActive(true)
    }
  }

  const completeExercise = async (index: number) => {
    // Stop cadence
    setCadenceActive(false)
    
    // Mark as completed
    setExerciseStates(prev => ({ ...prev, [index]: 'completed' }))
    
    // Save the exercise
    await saveExercise(index)
    
    // Start rest timer if there's a next exercise
    const nextIndex = index + 1
    if (nextIndex < exercises.length) {
      setRestTimer({
        active: true,
        timeLeft: 90, // 90 second rest
        forExercise: index
      })
    }
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
    return null
  }

  const isWorkoutCompleted = exercises.length > 0 && exercises.every((_, index) => exerciseStates[index] === 'completed')

  return (
    <AppLayout 
      onStartExercise={handleStartExercise}
      onLogWorkout={handleLogWorkout}
      onAddGoal={handleAddGoal}
      onScheduleWorkout={handleScheduleWorkout}
      onViewStats={handleViewStats}
      exerciseInProgress={cadenceActive}
      workoutCompleted={isWorkoutCompleted}
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

        {/* Cadence Control */}
        {todaysWorkout?.workoutType !== 'Rest' && (
          <div className="mb-6 text-center">
            <CadenceButton 
              isActive={cadenceActive}
              onClick={() => setCadenceActive(!cadenceActive)}
            />
          </div>
        )}

        {/* Rest Timer Display */}
        {restTimer?.active && (
          <div className="brand-card text-center mb-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Rest Timer</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {Math.floor(restTimer.timeLeft / 60)}:{(restTimer.timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-blue-600">
              Next: {exercises[restTimer.forExercise + 1]?.name || 'Workout Complete'}
            </p>
          </div>
        )}

        {/* Exercise Cards */}
        {todaysWorkout?.workoutType !== 'Rest' && exercises.length > 0 && (
          <div className="space-y-6">
            {exercises.map((exercise, index) => {
              const state = exerciseStates[index] || 'idle'
              const isActive = state === 'active'
              const isCompleted = state === 'completed'
              
              return (
                <div key={exercise.exercise_name} className={`
                  ${isActive ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
                  ${isCompleted ? 'opacity-75' : ''}
                `}>
                  <ExerciseCard
                    exercise={exercise}
                    onUpdate={(field, value) => updateExercise(index, field, value)}
                    onSave={() => completeExercise(index)}
                    isLoading={false}
                    saveError={null}
                  />
                  
                  {/* Exercise Controls */}
                  <div className="mt-4 text-center">
                    {state === 'idle' && (
                      <button
                        onClick={() => startExercise(index)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        Start Exercise
                      </button>
                    )}
                    
                    {state === 'active' && (
                      <button
                        onClick={() => completeExercise(index)}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        Complete Exercise
                      </button>
                    )}
                    
                    {state === 'completed' && (
                      <div className="text-green-600 font-medium">
                        ✓ Exercise Completed
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Workout Complete Message */}
        {isWorkoutCompleted && (
          <div className="brand-card text-center mt-8 bg-green-50 border-green-200">
            <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Workout Complete!</h2>
            <p className="text-green-600">Great job on completing your {todaysWorkout?.workoutType} workout!</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}