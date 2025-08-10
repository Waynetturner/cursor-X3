'use client'

import { useState, useEffect } from 'react'
import { UseCadenceControlReturn } from '@/types/workout'

// Audio beep function
function playBeep() {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = 880 // Hz
  gain.gain.value = 0.1
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.1) // short beep
  oscillator.onended = () => ctx.close()
}

export function useCadenceControl(): UseCadenceControlReturn {
  const [cadenceActive, setCadenceActive] = useState(false)
  const [cadenceInterval, setCadenceInterval] = useState<NodeJS.Timeout | null>(null)

  // Metronome beep effect
  useEffect(() => {
    console.log('🎵 Cadence useEffect triggered - cadenceActive:', cadenceActive)
    
    // Clear any existing interval first to prevent multiple instances
    if (cadenceInterval) {
      clearInterval(cadenceInterval)
      setCadenceInterval(null)
    }

    if (cadenceActive) {
      playBeep() // play immediately
      
      // Use the state-managed interval for consistency
      const interval = setInterval(() => {
        playBeep()
      }, 2000)
      setCadenceInterval(interval)
      console.log('🎵 Cadence interval started:', interval)
    } else {
      console.log('🎵 Cadence stopped')
    }

    return () => {
      // Cleanup happens in the next effect or when cadenceActive becomes false
    }
  }, [cadenceActive, cadenceInterval])

  // Separate effect to cleanup cadence interval when needed
  useEffect(() => {
    if (!cadenceActive && cadenceInterval) {
      console.log('🎵 Cleaning up cadence interval:', cadenceInterval)
      clearInterval(cadenceInterval)
      setCadenceInterval(null)
    }
  }, [cadenceActive, cadenceInterval])

  return {
    cadenceActive,
    cadenceInterval,
    setCadenceActive,
    setCadenceInterval
  }
}