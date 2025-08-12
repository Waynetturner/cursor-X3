'use client'

import { useState, useEffect, useRef } from 'react'
import { UseCadenceControlReturn } from '@/types/workout'

// Audio beep function
function playBeep() {
  try {
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
  } catch (error) {
    console.warn('Audio context error:', error)
  }
}

export function useCadenceControl(): UseCadenceControlReturn {
  const [cadenceActive, setCadenceActive] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (cadenceActive) {
      // Play immediately
      playBeep()
      
      // Set up interval
      intervalRef.current = setInterval(() => {
        playBeep()
      }, 2000)
      
      console.log('🎵 Cadence started')
    } else {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      console.log('🎵 Cadence stopped')
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [cadenceActive])

  return {
    cadenceActive,
    cadenceInterval: intervalRef.current,
    setCadenceActive,
    setCadenceInterval: () => {} // Deprecated, kept for compatibility
  }
}