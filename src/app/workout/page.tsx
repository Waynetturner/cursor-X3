'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useX3TTS } from '@/hooks/useX3TTS'
import { ttsPhaseService } from '@/lib/tts-phrases'
import { announceToScreenReader } from '@/lib/accessibility'
import { Play, Flame, Calendar, ArrowRight, Sparkles, TrendingUp, Users, Shield } from 'lucide-react'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'
import AnimatedCadenceButton from '@/components/AnimatedCadenceButton'
import ExerciseCard from '@/components/ExerciseCard'
import { BAND_COLORS } from '@/lib/supabase'
import { testModeService } from '@/lib/test-mode'

// Custom hooks
import { useWorkoutData } from '@/hooks/useWorkoutData'
import { useExerciseState } from '@/hooks/useExerciseState'
import { useCadenceControl } from '@/hooks/useCadenceControl'
import { useRestTimer } from '@/hooks/useRestTimer'
import { getUserToday, updateDailyWorkoutLog } from '@/lib/daily-workout-log'

export default function WorkoutPage() {
  const router = useRouter()
  const { hasFeature, tier } = useSubscription()
  const { speak, isLoading: ttsLoading, error: ttsError, getSourceIndicator } = useX3TTS()

  // Custom hooks for state management
  const {
    user,
    todaysWorkout,
    exercises,
    updateExercise,
    saveExercise
  } = useWorkoutData()

  const { cadenceActive, setCadenceActive } = useCadenceControl()

  const {
    exerciseStates,
    exerciseLoadingStates,
    ttsActiveStates,
    saveLoadingStates,
    saveErrorStates,
    startExercise,
    setExerciseStates,
    setSaveLoadingStates,
    setSaveErrorStates
  } = useExerciseState(exercises, setCadenceActive)

  const { restTimer, setRestTimer } = useRestTimer(
    exercises,
    exerciseStates,
    cadenceActive,
    setCadenceActive,
    startExercise
  )

  // Enhanced save exercise with proper error handling and TTS
  const handleSaveExercise = async (index: number) => {
    console.log('💾 Starting save for exercise index:', index)
    
    // Set loading state
    setSaveLoadingStates(prev => ({ ...prev, [index]: true }))
    setSaveErrorStates(prev => ({ ...prev, [index]: null }))
    
    try {
      await saveExercise(index)
      
      // Mark exercise as completed
      setExerciseStates(prev => ({ ...prev, [index]: 'completed' }))
      
      // Clear loading and error states
      setSaveLoadingStates(prev => ({ ...prev, [index]: false }))
      setSaveErrorStates(prev => ({ ...prev, [index]: null }))
      
      // Stop cadence if it's running (important for final exercise)
      if (cadenceActive) {
        console.log('🎵 Stopping cadence after exercise save')
        setCadenceActive(false)
        announceToScreenReader('Cadence stopped')
      }
      
      // Add TTS audio cue for exercise completion with better context detection
      const nextIndex = index + 1
      const isLastExercise = nextIndex >= exercises.length
      
      console.log(`🎯 Context Detection: Exercise ${index + 1} of ${exercises.length} (${exercises[index].name})`)
      
      if (hasFeature('ttsAudioCues')) {
        if (isLastExercise) {
          // Final exercise - workout completion
          console.log('🎉 TTS Context: WORKOUT COMPLETION')
          const nextWorkoutType = 'Push' // Simplified for refactoring
          const completionPhrase = ttsPhaseService.getWorkoutCompletionPhrase(
            todaysWorkout?.workoutType || 'Push',
            nextWorkoutType,
            tier === 'mastery' ? 'mastery' : 'momentum'
          )
          console.log(`🎉 Speaking completion phrase: "${completionPhrase}" with exercise context`)
          speak(completionPhrase, 'exercise')
        } else {
          // Exercise transition
          console.log('🔄 TTS Context: EXERCISE TRANSITION')
          const nextExercise = exercises[nextIndex]?.name || "your next exercise"
          const transitionPhrase = ttsPhaseService.getExerciseTransitionPhrase(
            exercises[index].name,
            nextExercise,
            tier === 'mastery' ? 'mastery' : 'momentum'
          )
          console.log(`🔄 Speaking transition phrase: "${transitionPhrase}" with exercise context`)
          speak(transitionPhrase, 'exercise')
        }
      }
      
      // Start 90-second rest timer for Momentum/Mastery users (but not for last exercise)
      if (hasFeature('restTimer') && !isLastExercise) {
        setRestTimer({
          isActive: true,
          timeLeft: 90,
          exerciseIndex: index
        })
      }

      // Auto-log workout completion when the final exercise is saved
      if (isLastExercise && user?.id && todaysWorkout?.workoutType && todaysWorkout.workoutType !== 'Rest') {
        try {
          const userToday = await getUserToday(user.id)
          await updateDailyWorkoutLog(user.id, userToday, todaysWorkout.workoutType as 'Push' | 'Pull')
          console.log('✅ Auto-logged daily workout on final exercise save')
        } catch (logErr) {
          console.error('❌ Failed to auto-log daily workout:', logErr)
        }
      }
    } catch (error) {
      console.error('❌ Error saving exercise:', error)
      
      // Set error state and clear loading
      setSaveLoadingStates(prev => ({ ...prev, [index]: false }))
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
      setSaveErrorStates(prev => ({ ...prev, [index]: errorMessage }))
      
      announceToScreenReader(`Error saving exercise: ${errorMessage}`, 'assertive')
    }
  }

  const handleRetrySave = (index: number) => {
    console.log('🔄 Retrying save for exercise index:', index)
    handleSaveExercise(index)
  }

  // Enhanced update exercise with cadence stop
  const handleUpdateExercise = (index: number, field: string, value: string | number | boolean) => {
    updateExercise(index, field, value)
    
    // Stop cadence if running
    if (cadenceActive) {
      console.log('🎵 Stopping cadence from updateExercise')
      setCadenceActive(false)
      announceToScreenReader('Cadence stopped')
    }
  }

  // Navigation handlers
  const handleStartExercise = () => router.push('/workout')
  const handleLogWorkout = () => router.push('/workout')
  const handleScheduleWorkout = () => router.push('/calendar')
  const handleViewStats = () => router.push('/stats')

  const getTomorrowsWorkout = () => {
    if (!user || !todaysWorkout) return 'Push'
    return 'Push' // Simplified
  }

  const signIn = async () => {
    announceToScreenReader('Redirecting to sign in...')
    router.push('/auth/signin')
  }

  const signUpWithEmail = () => {
    router.push('/auth/signup')
  }

  const signInWithEmail = () => {
    router.push('/auth/signin')
  }

  // If user is not authenticated, show splash page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Banner */}
        <header className="w-full bg-white border-b border-gray-200 p-8 text-center shadow-sm">
          <div className="max-w-6xl mx-auto">
            <h1 className="mb-4 flex justify-center">
              <X3MomentumWordmark size="lg" />
            </h1>
            <h2 className="text-headline-medium mb-2 text-secondary">AI-Powered X3 Resistance Band Tracker</h2>
            <p className="text-body italic text-secondary">Motivation. Progress. Results.</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Feature Grid - Bento Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* AI Coaching Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Sparkles className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI Coaching</h3>
              </div>
              <p className="text-gray-600 mb-4">Personalized guidance and motivation to keep you on track with your X3 journey.</p>
              <div className="flex items-center text-sm text-orange-600">
                <span>Smart insights</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Progress Analytics Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Progress Analytics</h3>
              </div>
              <p className="text-gray-600 mb-4">Track your strength gains, workout consistency, and personal bests over time.</p>
              <div className="flex items-center text-sm text-blue-600">
                <span>Data-driven insights</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* X3 Optimization Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <Flame className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">X3 Optimization</h3>
              </div>
              <p className="text-gray-600 mb-4">Specifically designed for X3 resistance bands and Dr. Jaquish's methodology.</p>
              <div className="flex items-center text-sm text-red-600">
                <span>Proven system</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Community Support Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Community Support</h3>
              </div>
              <p className="text-gray-600 mb-4">Connect with fellow X3 users and share your progress and achievements.</p>
              <div className="flex items-center text-sm text-green-600">
                <span>Join the movement</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Premium Security Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Premium Security</h3>
              </div>
              <p className="text-gray-600 mb-4">Enterprise-grade security to protect your personal fitness data and progress.</p>
              <div className="flex items-center text-sm text-purple-600">
                <span>Your data is safe</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Smart Scheduling Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Smart Scheduling</h3>
              </div>
              <p className="text-gray-600 mb-4">Automated workout scheduling based on the proven X3 program structure.</p>
              <div className="flex items-center text-sm text-indigo-600">
                <span>Never miss a workout</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform Your X3 Journey?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of X3 users who have eliminated motivation drop-off and achieved consistent results. 
              Start your personalized AI-powered fitness journey today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={signInWithEmail}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Sign In
              </button>
              <button 
                onClick={signUpWithEmail}
                className="bg-white hover:bg-gray-50 text-orange-600 font-semibold py-3 px-8 rounded-lg border-2 border-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Get Started Free
              </button>
            </div>
            
            <div className="mt-6">
              <button 
                onClick={signIn}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center mx-auto"
              >
                <span>Or continue with Google</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!todaysWorkout) {
    return (
      <div className="min-h-screen brand-gradient">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="card-elevation-2 bg-white rounded-xl p-6 text-center max-w-md mx-4">
            <div className="mb-6">
              <X3MomentumWordmark size="md" className="mx-auto mb-4" />
              <h2 className="text-headline-medium mb-2 text-secondary">Loading...</h2>
            </div>
            <div className="text-body mb-4" role="status" aria-live="polite">
              {user ? 'Loading your workout...' : 'Please sign in to continue'}
            </div>
            {user && (
              <div className="text-body-small text-secondary space-y-1">
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Exercises loaded: {exercises.length}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (todaysWorkout.workoutType === 'Rest') {
    const handleStartExercise = () => router.push('/workout')
    const handleLogWorkout = () => router.push('/workout')
    const handleScheduleWorkout = () => router.push('/calendar')
    const handleViewStats = () => router.push('/stats')

    return (
      <AppLayout 
        onStartExercise={handleStartExercise}
        onLogWorkout={handleLogWorkout}
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
                <h1 className="text-headline-large mb-4 brand-gold">Today's Rest Day</h1>
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

  // Determine current exercise state
  const exerciseInProgress = exercises.some(() => 
    Object.values(exerciseStates).some(state => state === 'in_progress')
  )
  const workoutCompleted = exercises.length > 0 && exercises.every(ex => ex.saved)

  return (
    <AppLayout 
      onStartExercise={handleStartExercise}
      onLogWorkout={handleLogWorkout}
      onScheduleWorkout={handleScheduleWorkout}
      onViewStats={handleViewStats}
      exerciseInProgress={exerciseInProgress}
      workoutCompleted={workoutCompleted}
    >
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
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Week {todaysWorkout?.week || 'Loading'}</span>
              </div>
            </div>
            <h1 className="text-display-medium mb-6 leading-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              {todaysWorkout?.status === 'catch_up' ? (
                <>Catch up: <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent font-black">{todaysWorkout?.workoutType || 'Loading'}</span> Workout</>
              ) : (
                <>Today's <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent font-black">{todaysWorkout?.workoutType || 'Loading'}</span> Workout</>
              )}
            </h1>
            <p className="text-title-large text-gray-700 font-medium italic tracking-wide">"Train to failure, not to a number"</p>
          </div>
        </div>

        {/* TTS Status Indicator (hidden when audio source is None and not speaking or error) */}
        {hasFeature('ttsAudioCues') && (ttsLoading || ttsError || getSourceIndicator() !== '🔇 No Audio') && (
          <div className="card-elevation-1 bg-apple-card spacing-apple-comfortable text-center mb-6 visual-depth-1 animate-on-load animate-apple-fade-in-up animate-delay-100">
            <div className="flex items-center justify-center space-x-2">
              {ttsLoading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  <span className="text-orange-600 text-sm font-medium">
                    🔊 Speaking...
                  </span>
                </div>
              )}
              {!ttsLoading && (
                <span className="text-body-small font-medium">
                  {getSourceIndicator()}
                </span>
              )}
            </div>
            {ttsError && (
              <p className="text-body-small text-red-600 mt-1">
                ⚠️ {ttsError}
              </p>
            )}
          </div>
        )}

        {/* Cadence Control */}
        <div className="card-elevation-1 bg-apple-card spacing-apple-comfortable text-center mb-10 visual-depth-1 animate-on-load animate-apple-fade-in-up animate-delay-200">
          <h3 className="text-title-large mb-4 text-gradient-fire">🎵 Workout Cadence</h3>
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4">
            <AnimatedCadenceButton cadenceActive={cadenceActive} setCadenceActive={setCadenceActive} />
            {exercises.length > 0 && !Object.values(exerciseStates).some(state => state !== 'idle' && state !== 'completed') && (
              <button
                onClick={() => startExercise(0)}
                disabled={exerciseLoadingStates[0] || exerciseStates[0] === 'started'}
                className={`py-3 px-6 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  exerciseLoadingStates[0] || exerciseStates[0] === 'started'
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed border border-gray-300' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                aria-describedby="cadence-description"
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
            )}
          </div>
          <p id="cadence-description" className="text-body-small text-secondary mt-2">
            Audio metronome to help maintain proper exercise timing
          </p>
        </div>

        {/* Rest Timer Display */}
        {restTimer && hasFeature('restTimer') && (
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
        )}

        {/* Exercise Grid */}
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
                onUpdateExercise={handleUpdateExercise}
                onSaveExercise={handleSaveExercise}
                onRetrySave={handleRetrySave}
              />
            ))}
          </div>
        </main>

      </div>
    </AppLayout>
  )
}