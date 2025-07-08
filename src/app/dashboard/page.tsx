'use client'

import { useState, useEffect } from 'react'
import { 
  Flame, 
  Timer, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Target, 
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Settings
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import RestTimer from '@/components/RestTimer'
import TTSSettings from '@/components/TTSSettings'
import { useX3TTS } from '@/hooks/useX3TTS'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useAudioCues } from '@/components/AudioCues'

interface WorkoutSession {
  id: string
  type: 'Push' | 'Pull'
  startTime: Date
  exercises: WorkoutExercise[]
  isActive: boolean
}

interface WorkoutExercise {
  id: string
  name: string
  bandColor: string
  fullReps: number
  partialReps: number
  completed: boolean
  personalBest: boolean
}

export default function DashboardPage() {
  const { tier, hasFeature } = useSubscription()
  const { speak, settings, isTTSAvailable } = useX3TTS()
  const { triggerCue, isAudioAvailable } = useAudioCues()
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [showTTSSettings, setShowTTSSettings] = useState(false)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)

  // Sample workout data
  const sampleExercises: WorkoutExercise[] = [
    { id: '1', name: 'Push-ups', bandColor: 'Black', fullReps: 0, partialReps: 0, completed: false, personalBest: false },
    { id: '2', name: 'Overhead Press', bandColor: 'Dark Gray', fullReps: 0, partialReps: 0, completed: false, personalBest: false },
    { id: '3', name: 'Chest Press', bandColor: 'Light Gray', fullReps: 0, partialReps: 0, completed: false, personalBest: false },
  ]

  const startWorkout = async (type: 'Push' | 'Pull') => {
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      type,
      startTime: new Date(),
      exercises: sampleExercises,
      isActive: true
    }
    
    setCurrentSession(session)
    setIsWorkoutActive(true)
    
    await triggerCue({
      type: 'workout_start',
      data: { workoutType: type }
    })
  }

  const completeExercise = async (exerciseId: string, fullReps: number, partialReps: number) => {
    if (!currentSession) return

    const updatedExercises = currentSession.exercises.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, fullReps, partialReps, completed: true }
        : ex
    )

    const exercise = updatedExercises.find(ex => ex.id === exerciseId)
    const isPersonalBest = fullReps > 15 // Simple logic for demo

    setCurrentSession({
      ...currentSession,
      exercises: updatedExercises
    })

    if (isPersonalBest) {
      await triggerCue({
        type: 'personal_best',
        data: { 
          exerciseName: exercise?.name,
          reps: fullReps,
          bandColor: exercise?.bandColor
        }
      })
    } else {
      await triggerCue({
        type: 'exercise_complete',
        data: { 
          exerciseName: exercise?.name,
          reps: fullReps + partialReps,
          bandColor: exercise?.bandColor
        }
      })
    }
  }

  const finishWorkout = async () => {
    if (!currentSession) return

    const totalExercises = currentSession.exercises.length
    const completedExercises = currentSession.exercises.filter(ex => ex.completed).length
    const totalReps = currentSession.exercises.reduce((sum, ex) => sum + ex.fullReps + ex.partialReps, 0)

    setCurrentSession(null)
    setIsWorkoutActive(false)

    await triggerCue({
      type: 'workout_complete',
      data: { 
        totalReps,
        completedExercises
      }
    })
  }

  const startRestTimer = () => {
    setShowRestTimer(true)
  }

  return (
    <AppLayout title="Dashboard">
      <div className="p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Workout Dashboard</h1>
            <div className="flex items-center space-x-3">
              {isTTSAvailable && (
                <button
                  onClick={() => setShowTTSSettings(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    settings.enabled 
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="TTS Settings"
                >
                  {settings.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 uppercase">
                {tier}
              </span>
            </div>
          </div>
        </header>

        <main className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="brand-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame size={24} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary">This Week</h3>
              <p className="text-3xl font-bold text-orange-600">3</p>
              <p className="text-sm text-secondary">Workouts</p>
            </div>

            <div className="brand-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy size={24} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary">Personal Bests</h3>
              <p className="text-3xl font-bold text-orange-600">7</p>
              <p className="text-sm text-secondary">This Month</p>
            </div>

            <div className="brand-card text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary">Progress</h3>
              <p className="text-3xl font-bold text-orange-600">+12%</p>
              <p className="text-sm text-secondary">vs Last Month</p>
            </div>
          </div>

          {/* Workout Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Start Workout */}
            <div className="brand-card">
              <h2 className="text-subhead mb-4">Start Workout</h2>
              {!isWorkoutActive ? (
                <div className="space-y-4">
                  <button
                    onClick={() => startWorkout('Push')}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Flame size={20} />
                    <span>Start Push Workout</span>
                  </button>
                  <button
                    onClick={() => startWorkout('Pull')}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Flame size={20} />
                    <span>Start Pull Workout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="font-semibold text-orange-800">
                      Active: {currentSession?.type} Workout
                    </h3>
                    <p className="text-sm text-orange-600">
                      Started at {currentSession?.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={finishWorkout}
                    className="w-full btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Target size={20} />
                    <span>Finish Workout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rest Timer */}
            <div className="brand-card">
              <h2 className="text-subhead mb-4">Rest Timer</h2>
              {showRestTimer ? (
                <RestTimer 
                  duration={90}
                  onComplete={() => {
                    if (isTTSAvailable && settings.enabled) {
                      speak("Rest period complete. Ready for your next set!")
                    }
                  }}
                />
              ) : (
                <div className="text-center">
                  <p className="text-secondary mb-4">
                    Take timed rest periods between sets
                  </p>
                  <button
                    onClick={startRestTimer}
                    className="btn-primary flex items-center justify-center space-x-2 mx-auto"
                  >
                    <Timer size={20} />
                    <span>Start Rest Timer</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Current Workout */}
          {currentSession && (
            <div className="brand-card">
              <h2 className="text-subhead mb-4">Current Workout: {currentSession.type}</h2>
              <div className="space-y-4">
                {currentSession.exercises.map((exercise) => (
                  <div 
                    key={exercise.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      exercise.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-primary">{exercise.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`px-2 py-1 rounded text-xs font-medium band-color-exempt ${
                            exercise.bandColor === 'White' ? 'bg-white text-black' :
                            exercise.bandColor === 'Light Gray' ? 'bg-gray-300 text-black' :
                            exercise.bandColor === 'Dark Gray' ? 'bg-gray-700 text-white' :
                            exercise.bandColor === 'Black' ? 'bg-black text-white' :
                            'bg-orange-500 text-white'
                          }`}
                        >
                          {exercise.bandColor}
                        </span>
                        {exercise.personalBest && (
                          <Trophy size={16} className="text-orange-600" />
                        )}
                      </div>
                    </div>
                    
                    {!exercise.completed ? (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Full reps"
                          className="flex-1 p-2 border border-gray-300 rounded"
                          min="0"
                        />
                        <input
                          type="number"
                          placeholder="Partial reps"
                          className="flex-1 p-2 border border-gray-300 rounded"
                          min="0"
                        />
                        <button
                          onClick={() => {
                            const fullReps = parseInt((document.querySelector(`input[placeholder="Full reps"]`) as HTMLInputElement)?.value || '0')
                            const partialReps = parseInt((document.querySelector(`input[placeholder="Partial reps"]`) as HTMLInputElement)?.value || '0')
                            completeExercise(exercise.id, fullReps, partialReps)
                          }}
                          className="btn-primary px-4"
                        >
                          Complete
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-secondary">
                        Completed: {exercise.fullReps} full reps, {exercise.partialReps} partial reps
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TTS Status */}
          {isTTSAvailable && (
            <div className="brand-card">
              <h2 className="text-subhead mb-4">Audio Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Voice Coaching</h3>
                  <p className="text-sm text-orange-600">
                    {settings.enabled 
                      ? 'Audio cues are enabled for exercise completion and personal bests'
                      : 'Audio cues are disabled'
                    }
                  </p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Rest Timer</h3>
                  <p className="text-sm text-orange-600">
                    Voice announcements for rest periods and countdown
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* TTS Settings Modal */}
        <TTSSettings 
          isOpen={showTTSSettings}
          onClose={() => setShowTTSSettings(false)}
        />
      </div>
    </AppLayout>
  )
} 