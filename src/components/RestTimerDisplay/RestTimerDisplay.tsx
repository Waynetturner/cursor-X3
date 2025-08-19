'use client'

import React from 'react'
import { RestTimerState, Exercise } from '@/types/workout'

export interface RestTimerDisplayProps {
  restTimer: RestTimerState | null
  exercises: Exercise[]
  setRestTimer: (timer: RestTimerState | null) => void
  hasRestTimerFeature: boolean
}

export function RestTimerDisplay({
  restTimer,
  exercises,
  setRestTimer,
  hasRestTimerFeature
}: RestTimerDisplayProps) {
  if (!restTimer || !hasRestTimerFeature) {
    return null
  }

  return (
    <div className="card-elevation-1 bg-apple-card spacing-apple-comfortable text-center mb-12 visual-depth-1 animate-on-load animate-apple-fade-in-up animate-delay-300">
      <h3 className="text-title-large mb-4 text-gradient-fire">⏱️ Rest Timer</h3>
      <div className="text-4xl font-bold brand-fire mb-2">
        {Math.floor(restTimer.timeLeft / 60)}:{(restTimer.timeLeft % 60).toString().padStart(2, '0')}
      </div>
      <p className="text-body-small text-secondary mb-3">
        Rest period for {exercises[restTimer.exerciseIndex]?.name}
      </p>
      <button
        onClick={() => setRestTimer(null)}
        className="btn-apple-style btn-secondary"
      >
        Skip Rest
      </button>
      <p className="text-body-small text-secondary mt-2">
        90-second rest period • Premium feature
      </p>
    </div>
  )
}