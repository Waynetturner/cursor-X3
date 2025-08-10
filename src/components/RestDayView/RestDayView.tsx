'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { WorkoutInfo } from '@/types/workout'

export interface RestDayViewProps {
  todaysWorkout: WorkoutInfo
}

export function RestDayView({ todaysWorkout }: RestDayViewProps) {
  const router = useRouter()

  const getTomorrowsWorkout = () => {
    // Simple logic for tomorrow's workout - this could be enhanced
    return 'Push'
  }

  const handleStartExercise = () => router.push('/workout')
  const handleLogWorkout = () => router.push('/workout')
  const handleAddGoal = () => router.push('/goals')
  const handleScheduleWorkout = () => router.push('/calendar')
  const handleViewStats = () => router.push('/stats')

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
        <main>
          <div className="max-w-2xl mx-auto">
            <div className="card-elevation-2 bg-white rounded-xl p-6 text-center">
              <div className="text-6xl mb-6" role="img" aria-label="Rest day relaxation emoji">🛋️</div>
              <h1 className="text-headline-large mb-4 brand-gold">Today&apos;s Rest Day</h1>
              <p className="text-body mb-8">Focus on recovery, hydration, and nutrition</p>
              
              <div className="text-left space-y-3 mb-6">
                <p className="text-body brand-fire font-medium">Recovery Checklist:</p>
                <div className="space-y-2 text-body-small">
                  <div className="flex items-center gap-3">
                    <span>💧</span>
                    <span>Drink 8+ glasses of water</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>🥗</span>
                    <span>Eat protein-rich meals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>😴</span>
                    <span>Get 7-9 hours of sleep</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>🚶</span>
                    <span>Light walking is beneficial</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>🧘</span>
                    <span>Practice stress management</span>
                  </div>
                </div>
              </div>
              
              <p className="text-body-small text-secondary">Week {todaysWorkout.week} • Day {todaysWorkout.dayInWeek + 1}</p>
              <p className="text-body brand-fire font-medium mt-4">
                Tomorrow: {getTomorrowsWorkout()} Workout Ready! 💪
              </p>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}