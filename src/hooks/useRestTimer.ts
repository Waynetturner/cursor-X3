'use client'

import { useState, useEffect } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useX3TTS } from '@/hooks/useX3TTS'
import { UseRestTimerReturn, RestTimerState, Exercise, ExerciseStates } from '@/types/workout'

export function useRestTimer(
  exercises: Exercise[],
  exerciseStates: ExerciseStates,
  cadenceActive: boolean,
  setCadenceActive: (active: boolean) => void,
  startExercise: (index: number) => void
): UseRestTimerReturn {
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null)
  const [restTimerInterval, setRestTimerInterval] = useState<NodeJS.Timeout | null>(null)

  const { tier } = useSubscription()
  const { speak } = useX3TTS()

  // Rest timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (restTimer?.isActive && restTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (!prev || prev.timeLeft <= 1) {
            // Timer finished - DO NOT speak rest complete phrase here
            // The next exercise will auto-start and speak exercise start phrase
            console.log('⏰ Rest timer finished - transitioning to next exercise')
            return null
          }
          
          const newTimeLeft = prev.timeLeft - 1
          
          // Just decrement the timer - cadence logic is handled in separate effect
          return { ...prev, timeLeft: newTimeLeft }
        })
      }, 1000)
      setRestTimerInterval(interval)
    } else {
      if (restTimerInterval) {
        clearInterval(restTimerInterval)
        setRestTimerInterval(null)
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval)
        setRestTimerInterval(null)
      }
    }
  }, [restTimer?.isActive, restTimerInterval])
  
  // Separate effect to handle precise countdown timing during rest timer
  useEffect(() => {
    if (!restTimer?.isActive || cadenceActive) return
    
    const timeLeft = restTimer.timeLeft
    const nextExerciseIndex = restTimer.exerciseIndex + 1
    
    // Only proceed if there's a next exercise
    if (nextExerciseIndex >= exercises.length) return
    
    const nextExercise = exercises[nextExerciseIndex]
    console.log(`⏰ Rest timer: ${timeLeft}s remaining (${90 - timeLeft}s elapsed) for next exercise: ${nextExercise.name}`)
    
    // CORRECTED: Calculate elapsed time for proper countdown timing
    const timeElapsed = 90 - timeLeft // How much time has passed since timer started
    
    // Countdown happens in the FINAL 8 seconds (when 84+ seconds have elapsed)
    if (timeElapsed === 84) { // 84 seconds elapsed = 6 seconds remaining
      console.log('⏰ TTS: Speaking "three" at 84 seconds ELAPSED (6 seconds remaining)')
      speak('three', 'countdown')
    } else if (timeElapsed === 86) { // 86 seconds elapsed = 4 seconds remaining
      console.log('⏰ TTS: Speaking "two" at 86 seconds ELAPSED (4 seconds remaining)')
      speak('two', 'countdown')
    } else if (timeElapsed === 88) { // 88 seconds elapsed = 2 seconds remaining
      console.log('⏰ TTS: Speaking "one" at 88 seconds ELAPSED (2 seconds remaining)')
      speak('one', 'countdown')
      // Start cadence for final countdown
      setCadenceActive(true)
      console.log('🎵 Starting cadence for next exercise prep during final countdown')
    } else if (timeElapsed === 80) { // 80 seconds elapsed = 10 seconds remaining
      // CORRECTED: Lead-in phrase timing to end just before countdown
      // Estimate: "Get ready for [exercise name] in" takes about 3-4 seconds to say
      // Start at 80 seconds elapsed (10 remaining) to finish by 83-84 seconds elapsed
      const leadInPhrase = `Get ready for ${nextExercise.name} in`
      console.log(`⏰ TTS: Speaking lead-in phrase at 80 seconds ELAPSED (10 seconds remaining): "${leadInPhrase}"`)
      speak(leadInPhrase, 'rest')
    }
  }, [restTimer?.timeLeft, restTimer?.isActive, cadenceActive, restTimer?.exerciseIndex, exercises, tier, speak, setCadenceActive])

  // Auto-start next exercise when rest timer finishes
  useEffect(() => {
    // Only trigger when restTimer changes from active to null (timer just finished)
    if (restTimer === null && exercises.length > 0) {
      // Find the most recent completed exercise to determine the next one
      const completedExercises = Object.entries(exerciseStates)
        .filter(([_, state]) => state === 'completed')
        .map(([index, _]) => parseInt(index))
      
      if (completedExercises.length > 0) {
        const lastCompletedIndex = Math.max(...completedExercises)
        const nextExerciseIndex = lastCompletedIndex + 1
        
        // Only auto-start if we have a next exercise and it's not already started
        if (nextExerciseIndex < exercises.length && 
            (!exerciseStates[nextExerciseIndex] || exerciseStates[nextExerciseIndex] === 'idle')) {
          
          console.log(`🚀 Rest timer finished! Auto-starting next exercise: ${exercises[nextExerciseIndex].exercise_name} (index ${nextExerciseIndex})`)
          
          // Auto-start the next exercise after a short delay to let cadence settle
          setTimeout(() => {
            startExercise(nextExerciseIndex)
          }, 500)
        }
      }
    }
  }, [restTimer, exercises, exerciseStates, startExercise])

  return {
    restTimer,
    restTimerInterval,
    setRestTimer,
    setRestTimerInterval
  }
}