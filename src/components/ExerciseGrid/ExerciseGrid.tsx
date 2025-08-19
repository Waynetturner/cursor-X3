'use client'

import React from 'react'
import ExerciseCard from '@/components/ExerciseCard'
import { BAND_COLORS } from '@/lib/supabase'
import {
  Exercise,
  ExerciseStates,
  SaveLoadingStates,
  SaveErrorStates,
  TtsActiveStates
} from '@/types/workout'

export interface ExerciseGridProps {
  exercises: Exercise[]
  exerciseStates: ExerciseStates
  saveLoadingStates: SaveLoadingStates
  saveErrorStates: SaveErrorStates
  ttsActiveStates: TtsActiveStates
  onUpdateExercise: (index: number, field: string, value: string | number | boolean) => void
  onSaveExercise: (index: number) => Promise<void>
  onRetrySave: (index: number) => void
}

export function ExerciseGrid({
  exercises,
  exerciseStates,
  saveLoadingStates,
  saveErrorStates,
  ttsActiveStates,
  onUpdateExercise,
  onSaveExercise,
  onRetrySave
}: ExerciseGridProps) {
  if (exercises.length === 0) {
    return null
  }

  return (
    <main>
      <h2 className="sr-only">Exercise tracking cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 visual-depth-floating animate-on-load animate-apple-fade-in-up animate-delay-400">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.name}
            exercise={exercise}
            index={index}
            exerciseState={exerciseStates[index] || 'idle'}
            isSaveLoading={saveLoadingStates[index] || false}
            saveError={saveErrorStates[index] || null}
            ttsActive={ttsActiveStates[index] || false}
            bandColors={BAND_COLORS}
            onUpdateExercise={onUpdateExercise}
            onSaveExercise={onSaveExercise}
            onRetrySave={onRetrySave}
          />
        ))}
      </div>
    </main>
  )
}