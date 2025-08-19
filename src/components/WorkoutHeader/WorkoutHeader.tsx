'use client'

import React from 'react'
import { WorkoutInfo } from '@/types/workout'
import { testModeService } from '@/lib/test-mode'

export interface WorkoutHeaderProps {
  todaysWorkout: WorkoutInfo | null
}

export function WorkoutHeader({ todaysWorkout }: WorkoutHeaderProps) {
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Test Mode Banner */}
      {testModeService.isEnabled() && (
        <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🧪</span>
            <span className="text-purple-800 font-bold text-lg">TEST MODE ACTIVE</span>
          </div>
          <p className="text-purple-700 text-center text-sm mt-2">
            {testModeService.getTestModeIndicator()}
          </p>
          <p className="text-purple-600 text-center text-xs mt-1">
            All features are functional with mock data. TTS uses browser speech synthesis.
          </p>
        </div>
      )}

      {/* Motivational Greeting */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50/50 to-red-50/30 border border-orange-200/50 rounded-3xl spacing-apple-spacious mb-12 shadow-2xl transform hover:scale-[1.02] transition-all duration-500 visual-depth-2 animate-on-load animate-apple-scale-in">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-3xl"></div>
        <div className="relative z-10 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Week {todaysWorkout?.week || 'Loading'}
              </span>
            </div>
          </div>
          <h1 className="text-display-medium mb-6 leading-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            {todaysWorkout?.status === 'catch_up' ? (
              <>
                Catch up: <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent font-black">
                  {todaysWorkout?.workoutType || 'Loading'}
                </span> Workout
              </>
            ) : (
              <>
                Today&apos;s <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent font-black">
                  {todaysWorkout?.workoutType || 'Loading'}
                </span> Workout
              </>
            )}
          </h1>
          <p className="text-title-large text-gray-700 font-medium italic tracking-wide">
            &quot;Train to failure, not to a number&quot;
          </p>
        </div>
      </div>
    </div>
  )
}