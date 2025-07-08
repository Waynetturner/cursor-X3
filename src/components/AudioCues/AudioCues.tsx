'use client'

import { useEffect, useCallback } from 'react'
import { useX3TTS } from '@/hooks/useX3TTS'
import { useSubscription } from '@/contexts/SubscriptionContext'

export interface AudioCueEvent {
  type: 'exercise_complete' | 'personal_best' | 'workout_start' | 'workout_complete' | 'cadence_reminder' | 'rest_start' | 'rest_complete'
  data?: {
    exerciseName?: string
    reps?: number
    bandColor?: string
    workoutType?: string
    totalReps?: number
    completedExercises?: number
  }
}

interface AudioCuesProps {
  event?: AudioCueEvent
  onEventProcessed?: () => void
}

export default function AudioCues({ event, onEventProcessed }: AudioCuesProps) {
  const { tier, hasFeature } = useSubscription()
  const { speak, isTTSAvailable, settings } = useX3TTS()

  const generateCueMessage = useCallback((event: AudioCueEvent): string => {
    const { type, data } = event

    switch (type) {
      case 'exercise_complete':
        const reps = data?.reps || 0
        const exerciseName = data?.exerciseName || 'exercise'
        const bandColor = data?.bandColor || 'band'
        
        if (tier === 'foundation') {
          return '' // No audio for foundation tier
        } else if (tier === 'momentum') {
          return `Great work! ${reps} reps on ${exerciseName} with ${bandColor} band.`
        } else {
          // Mastery tier - more detailed feedback
          return `Excellent form on ${exerciseName}! ${reps} reps with ${bandColor} resistance. Keep pushing!`
        }

      case 'personal_best':
        const pbReps = data?.reps || 0
        const pbExercise = data?.exerciseName || 'exercise'
        
        if (tier === 'foundation') {
          return '' // No audio for foundation tier
        } else if (tier === 'momentum') {
          return `Personal best! ${pbReps} reps on ${pbExercise}.`
        } else {
          // Mastery tier - more motivational
          return `New personal record! ${pbReps} reps on ${pbExercise}. You're getting stronger every day!`
        }

      case 'workout_start':
        const workoutType = data?.workoutType || 'workout'
        
        if (tier === 'foundation') {
          return '' // No audio for foundation tier
        } else if (tier === 'momentum') {
          return `Starting ${workoutType} workout. Let's get after it!`
        } else {
          // Mastery tier - more motivational
          return `Time to crush this ${workoutType} workout! Remember your form and breathe. Let's go!`
        }

      case 'workout_complete':
        const totalReps = data?.totalReps || 0
        const completedExercises = data?.completedExercises || 0
        
        if (tier === 'foundation') {
          return '' // No audio for foundation tier
        } else if (tier === 'momentum') {
          return `Workout complete! ${completedExercises} exercises finished with ${totalReps} total reps.`
        } else {
          // Mastery tier - more detailed feedback
          return `Outstanding workout! You completed ${completedExercises} exercises with ${totalReps} total reps. Your dedication is paying off!`
        }

      case 'cadence_reminder':
        if (tier === 'foundation') {
          return '' // No audio for foundation tier
        } else if (tier === 'momentum') {
          return "Remember your cadence. Slow and controlled."
        } else {
          // Mastery tier - more specific
          return "Focus on your tempo. Two seconds down, one second up. Control the movement."
        }

      case 'rest_start':
        if (tier === 'foundation') {
          return '' // No audio for foundation tier
        } else if (tier === 'momentum') {
          return "Rest period started. Take deep breaths."
        } else {
          // Mastery tier - more detailed
          return "Rest period begins. Focus on your breathing and prepare for the next set."
        }

      case 'rest_complete':
        if (tier === 'foundation') {
          return '' // No audio for foundation tier
        } else if (tier === 'momentum') {
          return "Rest complete. Ready for next set."
        } else {
          // Mastery tier - more motivational
          return "Rest period complete. Time to get back to work and push through this set!"
        }

      default:
        return ''
    }
  }, [tier])

  useEffect(() => {
    if (!event || !isTTSAvailable || !settings.enabled) {
      onEventProcessed?.()
      return
    }

    const message = generateCueMessage(event)
    
    if (message) {
      speak(message).then(() => {
        onEventProcessed?.()
      })
    } else {
      onEventProcessed?.()
    }
  }, [event, isTTSAvailable, settings.enabled, generateCueMessage, speak, onEventProcessed])

  // This component doesn't render anything visible
  return null
}

// Hook for easy audio cue triggering
export function useAudioCues() {
  const { tier, hasFeature } = useSubscription()
  const { speak, isTTSAvailable, settings } = useX3TTS()

  const triggerCue = useCallback(async (event: AudioCueEvent) => {
    if (!isTTSAvailable || !settings.enabled) {
      return
    }

    const message = (() => {
      const { type, data } = event

      switch (type) {
        case 'exercise_complete':
          const reps = data?.reps || 0
          const exerciseName = data?.exerciseName || 'exercise'
          const bandColor = data?.bandColor || 'band'
          
          if (tier === 'foundation') {
            return ''
          } else if (tier === 'momentum') {
            return `Great work! ${reps} reps on ${exerciseName} with ${bandColor} band.`
          } else {
            return `Excellent form on ${exerciseName}! ${reps} reps with ${bandColor} resistance. Keep pushing!`
          }

        case 'personal_best':
          const pbReps = data?.reps || 0
          const pbExercise = data?.exerciseName || 'exercise'
          
          if (tier === 'foundation') {
            return ''
          } else if (tier === 'momentum') {
            return `Personal best! ${pbReps} reps on ${pbExercise}.`
          } else {
            return `New personal record! ${pbReps} reps on ${pbExercise}. You're getting stronger every day!`
          }

        case 'workout_start':
          const workoutType = data?.workoutType || 'workout'
          
          if (tier === 'foundation') {
            return ''
          } else if (tier === 'momentum') {
            return `Starting ${workoutType} workout. Let's get after it!`
          } else {
            return `Time to crush this ${workoutType} workout! Remember your form and breathe. Let's go!`
          }

        case 'workout_complete':
          const totalReps = data?.totalReps || 0
          const completedExercises = data?.completedExercises || 0
          
          if (tier === 'foundation') {
            return ''
          } else if (tier === 'momentum') {
            return `Workout complete! ${completedExercises} exercises finished with ${totalReps} total reps.`
          } else {
            return `Outstanding workout! You completed ${completedExercises} exercises with ${totalReps} total reps. Your dedication is paying off!`
          }

        case 'cadence_reminder':
          if (tier === 'foundation') {
            return ''
          } else if (tier === 'momentum') {
            return "Remember your cadence. Slow and controlled."
          } else {
            return "Focus on your tempo. Two seconds down, one second up. Control the movement."
          }

        case 'rest_start':
          if (tier === 'foundation') {
            return ''
          } else if (tier === 'momentum') {
            return "Rest period started. Take deep breaths."
          } else {
            return "Rest period begins. Focus on your breathing and prepare for the next set."
          }

        case 'rest_complete':
          if (tier === 'foundation') {
            return ''
          } else if (tier === 'momentum') {
            return "Rest complete. Ready for next set."
          } else {
            return "Rest period complete. Time to get back to work and push through this set!"
          }

        default:
          return ''
      }
    })()

    if (message) {
      await speak(message)
    }
  }, [tier, isTTSAvailable, settings.enabled, speak])

  return {
    triggerCue,
    isAudioAvailable: isTTSAvailable && settings.enabled,
    tier
  }
} 