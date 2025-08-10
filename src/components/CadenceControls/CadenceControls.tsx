'use client'

import React from 'react'
import { Play } from 'lucide-react'
import AnimatedCadenceButton from '@/components/AnimatedCadenceButton'
import { WorkoutInfo, ExerciseStates, ExerciseLoadingStates } from '@/types/workout'

export interface CadenceControlsProps {
  cadenceActive: boolean
  setCadenceActive: (active: boolean) => void
  todaysWorkout: WorkoutInfo | null
  exerciseStates: ExerciseStates
  exerciseLoadingStates: ExerciseLoadingStates
  startExercise: (index: number) => void
  hasExercises: boolean
}

export function CadenceControls({
  cadenceActive,
  setCadenceActive,
  todaysWorkout,
  exerciseStates,
  exerciseLoadingStates,
  startExercise,
  hasExercises
}: CadenceControlsProps) {
  const hasActiveExercise = Object.values(exerciseStates).some(state => state !== 'idle' && state !== 'completed')

  return (
    <div className="card-elevation-1 bg-apple-card spacing-apple-comfortable text-center mb-12 visual-depth-1 animate-on-load animate-apple-fade-in-up animate-delay-200">
      <h3 className="text-title-large mb-4 text-gradient-fire">🎵 Workout Cadence</h3>
      
      <div className="w-full flex justify-center">
        <AnimatedCadenceButton 
          cadenceActive={cadenceActive} 
          setCadenceActive={setCadenceActive} 
        />
      </div>
      
      <p id="cadence-description" className="text-body-small text-secondary mt-2">
        Audio metronome to help maintain proper exercise timing
      </p>
      
      {/* Start Exercise Button */}
      {hasExercises && !hasActiveExercise && (
        <div className="mt-6">
          <button
            onClick={() => startExercise(0)}
            disabled={exerciseLoadingStates[0] || exerciseStates[0] === 'started'}
            className={`btn-apple-style py-3 px-8 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              exerciseLoadingStates[0] || exerciseStates[0] === 'started'
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {exerciseLoadingStates[0] || exerciseStates[0] === 'started' ? (
              <>
                <div className="inline animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting Workout...
              </>
            ) : (
              <>
                <Play className="inline mr-2" size={16} aria-hidden="true" />
                Start Exercise
              </>
            )}
          </button>
          <p className="text-body-small text-secondary mt-2">
            Begin the full {todaysWorkout?.workoutType} workout sequence
          </p>
        </div>
      )}
    </div>
  )
}