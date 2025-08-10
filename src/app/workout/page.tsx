'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useX3TTS } from '@/hooks/useX3TTS'
import { ttsPhaseService } from '@/lib/tts-phrases'
import { announceToScreenReader } from '@/lib/accessibility'

// Custom hooks
import { useWorkoutData } from '@/hooks/useWorkoutData'
import { useExerciseState } from '@/hooks/useExerciseState'
import { useCadenceControl } from '@/hooks/useCadenceControl'
import { useRestTimer } from '@/hooks/useRestTimer'

// Components
import { WorkoutHeader } from '@/components/WorkoutHeader'
import { WorkoutSplashPage } from '@/components/WorkoutSplashPage'
import { LoadingView } from '@/components/LoadingView'
import { RestDayView } from '@/components/RestDayView'
import { TTSStatus } from '@/components/TTSStatus'
import { CadenceControls } from '@/components/CadenceControls'
import { RestTimerDisplay } from '@/components/RestTimerDisplay'
import { ExerciseGrid } from '@/components/ExerciseGrid'

export default function WorkoutPage() {
  const router = useRouter()
  const { hasFeature, tier } = useSubscription()
  const { speak, isLoading: ttsLoading, error: ttsError, getSourceIndicator } = useX3TTS()

  // Custom hooks for state management
  const {
    user,
    todaysWorkout,
    exercises,
    updateExercise,
    saveExercise
    // Removed unused retrySaveExercise
  } = useWorkoutData()

  const { cadenceActive, setCadenceActive } = useCadenceControl()

  const {
    exerciseStates,
    exerciseLoadingStates,
    ttsActiveStates,
    saveLoadingStates,
    saveErrorStates,
    startExercise,
    setExerciseStates,
    setSaveLoadingStates,
    setSaveErrorStates
  } = useExerciseState(exercises, setCadenceActive)

  const { restTimer, setRestTimer } = useRestTimer(
    exercises,
    exerciseStates,
    cadenceActive,
    setCadenceActive,
    startExercise
  )

  // Enhanced save exercise with proper error handling and TTS
  const handleSaveExercise = async (index: number) => {
    console.log('💾 Starting save for exercise index:', index)
    
    // Set loading state
    setSaveLoadingStates(prev => ({ ...prev, [index]: true }))
    setSaveErrorStates(prev => ({ ...prev, [index]: null }))
    
    try {
      await saveExercise(index)
      
      // Mark exercise as completed
      setExerciseStates(prev => ({ ...prev, [index]: 'completed' }))
      
      // Clear loading and error states
      setSaveLoadingStates(prev => ({ ...prev, [index]: false }))
      setSaveErrorStates(prev => ({ ...prev, [index]: null }))
      
      // Stop cadence if it's running (important for final exercise)
      if (cadenceActive) {
        console.log('🎵 Stopping cadence after exercise save')
        setCadenceActive(false)
        announceToScreenReader('Cadence stopped')
      }
      
      // Add TTS audio cue for exercise completion with better context detection
      const nextIndex = index + 1
      const isLastExercise = nextIndex >= exercises.length
      
      console.log(`🎯 Context Detection: Exercise ${index + 1} of ${exercises.length} (${exercises[index].name})`)
      console.log(`🎯 Next index: ${nextIndex}, Is last exercise: ${isLastExercise}`)
      
      if (hasFeature('ttsAudioCues')) {
        if (isLastExercise) {
          // Final exercise - workout completion
          console.log('🎉 TTS Context: WORKOUT COMPLETION')
          const nextWorkoutType = 'Push' // Simplified for refactoring
          const completionPhrase = ttsPhaseService.getWorkoutCompletionPhrase(
            todaysWorkout?.workoutType || 'Push',
            nextWorkoutType,
            tier === 'mastery' ? 'mastery' : 'momentum'
          )
          console.log(`🎉 Speaking completion phrase: "${completionPhrase}" with exercise context`)
          speak(completionPhrase, 'exercise')
        } else {
          // Exercise transition
          console.log('🔄 TTS Context: EXERCISE TRANSITION')
          const nextExercise = exercises[nextIndex]?.name || "your next exercise"
          console.log(`🔄 Transitioning from ${exercises[index].name} to ${nextExercise}`)
          const transitionPhrase = ttsPhaseService.getExerciseTransitionPhrase(
            exercises[index].name,
            nextExercise,
            tier === 'mastery' ? 'mastery' : 'momentum'
          )
          console.log(`🔄 Speaking transition phrase: "${transitionPhrase}" with exercise context`)
          speak(transitionPhrase, 'exercise')
        }
      }
      
      // Start 90-second rest timer for Momentum/Mastery users (but not for last exercise)
      if (hasFeature('restTimer') && !isLastExercise) {
        setRestTimer({
          isActive: true,
          timeLeft: 90,
          exerciseIndex: index
        })
      }
    } catch (error) {
      console.error('❌ Error saving exercise:', error)
      
      // Set error state and clear loading
      setSaveLoadingStates(prev => ({ ...prev, [index]: false }))
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
      setSaveErrorStates(prev => ({ ...prev, [index]: errorMessage }))
      
      announceToScreenReader(`Error saving exercise: ${errorMessage}`, 'assertive')
    }
  }

  const handleRetrySave = (index: number) => {
    console.log('🔄 Retrying save for exercise index:', index)
    handleSaveExercise(index)
  }

  // Enhanced update exercise with cadence stop
  const handleUpdateExercise = (index: number, field: string, value: string | number | boolean) => {
    updateExercise(index, field, value)
    
    // Stop cadence if running
    if (cadenceActive) {
      console.log('🎵 Stopping cadence from updateExercise')
      setCadenceActive(false)
      announceToScreenReader('Cadence stopped')
    }
  }

  // Navigation handlers
  const handleStartExercise = () => router.push('/workout')
  const handleLogWorkout = () => router.push('/workout')
  const handleAddGoal = () => router.push('/goals')
  const handleScheduleWorkout = () => router.push('/calendar')
  const handleViewStats = () => router.push('/stats')

  // Render different views based on state
  if (!user) {
    return <WorkoutSplashPage />
  }

  if (!todaysWorkout) {
    return <LoadingView user={user} exerciseCount={exercises.length} />
  }

  if (todaysWorkout.workoutType === 'Rest') {
    return <RestDayView todaysWorkout={todaysWorkout} />
  }

  // Determine current exercise state
  const exerciseInProgress = exercises.some(() => 
    Object.values(exerciseStates).some(state => state === 'in_progress')
  )
  const workoutCompleted = exercises.length > 0 && exercises.every(ex => ex.saved)

  return (
    <AppLayout 
      onStartExercise={handleStartExercise}
      onLogWorkout={handleLogWorkout}
      onAddGoal={handleAddGoal}
      onScheduleWorkout={handleScheduleWorkout}
      onViewStats={handleViewStats}
      exerciseInProgress={exerciseInProgress}
      workoutCompleted={workoutCompleted}
    >
      <WorkoutHeader todaysWorkout={todaysWorkout} />

      {/* TTS Status Indicator */}
      <TTSStatus
        hasFeature={hasFeature('ttsAudioCues')}
        ttsLoading={ttsLoading}
        ttsError={ttsError}
        getSourceIndicator={getSourceIndicator}
      />

      {/* Cadence Control */}
      <CadenceControls
        cadenceActive={cadenceActive}
        setCadenceActive={setCadenceActive}
        todaysWorkout={todaysWorkout}
        exerciseStates={exerciseStates}
        exerciseLoadingStates={exerciseLoadingStates}
        startExercise={startExercise}
        hasExercises={exercises.length > 0}
      />

      {/* Rest Timer Display */}
      <RestTimerDisplay
        restTimer={restTimer}
        exercises={exercises}
        setRestTimer={setRestTimer}
        hasRestTimerFeature={hasFeature('restTimer')}
      />

      {/* Exercise Grid */}
      <ExerciseGrid
        exercises={exercises}
        exerciseStates={exerciseStates}
        saveLoadingStates={saveLoadingStates}
        saveErrorStates={saveErrorStates}
        ttsActiveStates={ttsActiveStates}
        onUpdateExercise={handleUpdateExercise}
        onSaveExercise={handleSaveExercise}
        onRetrySave={handleRetrySave}
      />
    </AppLayout>
  )
}