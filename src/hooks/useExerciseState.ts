'use client'

import { useState } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useX3TTS } from '@/hooks/useX3TTS'
import { ttsPhaseService } from '@/lib/tts-phrases'
import { announceToScreenReader } from '@/lib/accessibility'
import {
  ExerciseStates,
  ExerciseLoadingStates,
  TtsActiveStates,
  SaveLoadingStates,
  SaveErrorStates,
  UseExerciseStateReturn,
  Exercise
} from '@/types/workout'

export function useExerciseState(
  exercises: Exercise[],
  setCadenceActive: (active: boolean) => void
): UseExerciseStateReturn {
  const [exerciseStates, setExerciseStates] = useState<ExerciseStates>({})
  const [exerciseLoadingStates, setExerciseLoadingStates] = useState<ExerciseLoadingStates>({})
  const [ttsActiveStates, setTtsActiveStates] = useState<TtsActiveStates>({})
  const [saveLoadingStates, setSaveLoadingStates] = useState<SaveLoadingStates>({})
  const [saveErrorStates, setSaveErrorStates] = useState<SaveErrorStates>({})

  const { hasFeature, tier } = useSubscription()
  const { speak } = useX3TTS()

  const startExercise = async (index: number) => {
    const exercise = exercises[index]
    
    console.log('🚀 Starting exercise:', exercise.name)
    
    // Set exercise state to started
    setExerciseStates(prev => ({ ...prev, [index]: 'started' }))
    setExerciseLoadingStates(prev => ({ ...prev, [index]: true }))
    
    try {
      // Only use TTS for premium users
      if (hasFeature('ttsAudioCues')) {
        setTtsActiveStates(prev => ({ ...prev, [index]: true }))
        
        // Get exercise start phrase from phrase library
        const startPhrase = ttsPhaseService.getExerciseStartPhrase(
          exercise.name, 
          tier === 'mastery' ? 'mastery' : 'momentum'
        )
        
        // Speak the start phrase with exercise context
        await speak(startPhrase, 'exercise')
        
        setTtsActiveStates(prev => ({ ...prev, [index]: false }))
        
        // Screen reader announcement with audio guidance
        announceToScreenReader(`Starting ${exercise.name} with audio guidance. Exercise is now in progress.`, 'assertive')
      } else {
        // Basic screen reader announcement for Foundation users
        announceToScreenReader(`Starting ${exercise.name}. Exercise is now in progress.`, 'assertive')
      }
      
      // Set exercise state to in progress after TTS completes (or immediately for Foundation users)
      setExerciseStates(prev => ({ ...prev, [index]: 'in_progress' }))
      
      // Start cadence automatically
      setCadenceActive(true)
      console.log('🎵 Auto-starting cadence for exercise')
      
    } catch (error) {
      console.error('Error starting exercise:', error)
      setExerciseStates(prev => ({ ...prev, [index]: 'idle' }))
      setTtsActiveStates(prev => ({ ...prev, [index]: false }))
    } finally {
      // Clear loading state for this exercise button
      setExerciseLoadingStates(prev => ({ ...prev, [index]: false }))
    }
  }

  return {
    exerciseStates,
    exerciseLoadingStates,
    ttsActiveStates,
    saveLoadingStates,
    saveErrorStates,
    startExercise,
    setExerciseStates,
    setExerciseLoadingStates,
    setTtsActiveStates,
    setSaveLoadingStates,
    setSaveErrorStates
  }
}