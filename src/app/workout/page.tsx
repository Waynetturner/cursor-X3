'use client'

import { useState, useEffect } from 'react'
import { supabase, X3_EXERCISES, BAND_COLORS, getTodaysWorkout } from '@/lib/supabase'
import { announceToScreenReader } from '@/lib/accessibility'
import { Loader2 } from 'lucide-react'
import React from 'react'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'
import AppLayout from '@/components/layout/AppLayout'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useX3TTS } from '@/hooks/useX3TTS'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import { testModeService } from '@/lib/test-mode'
import { getCurrentCentralISOString } from '@/lib/timezone'
import { ttsPhaseService } from '@/lib/tts-phrases'
import CoachChat from '@/components/CoachChat/CoachChat'
import ExerciseCard from '@/components/ExerciseCard'
import CadenceButton from '@/components/CadenceButton'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Helper to get local ISO string with timezone offset
function getLocalISODateTime() {
  const timestamp = getCurrentCentralISOString();
  console.log('🕒 Generated Central timestamp:', timestamp);
  return timestamp;
}

// Helper to format workout dates correctly without timezone conversion
function formatWorkoutDate(timestamp: string): string {
  const dateStr = timestamp.split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    return `${month}/${day}/${year}`;
  }
  return new Date(timestamp).toLocaleDateString();
}

function playBeep() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880; // Hz
  gain.gain.value = 0.1;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.1); // short beep
  oscillator.onended = () => ctx.close();
}

interface Exercise {
  id?: string;
  exercise_name: string;
  band_color: string;
  full_reps: number;
  partial_reps: number;
  notes: string;
  saved: boolean;
  previousData?: any;
  workout_local_date_time: string;
  name: string;
  band: string;
  fullReps: number;
  partialReps: number;
  lastWorkout: string;
  lastWorkoutDate: string;
}

export default function WorkoutPage() {
  const [user, setUser] = useState<any>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [cadenceActive, setCadenceActive] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [cadenceInterval, setCadenceInterval] = useState<NodeJS.Timeout | null>(null);
  const [restTimer, setRestTimer] = useState<{ isActive: boolean; timeLeft: number; exerciseIndex: number } | null>(null);
  const [restTimerInterval, setRestTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [exerciseLoadingStates, setExerciseLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [exerciseStates, setExerciseStates] = useState<{ [key: number]: 'idle' | 'started' | 'in_progress' | 'completed' }>({});
  const [ttsActiveStates, setTtsActiveStates] = useState<{ [key: number]: boolean }>({});
  const [saveLoadingStates, setSaveLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [saveErrorStates, setSaveErrorStates] = useState<{ [key: number]: string | null }>({});
  const { hasFeature, tier } = useSubscription();
  const { speak, isLoading: ttsLoading, error: ttsError, getSourceIndicator } = useX3TTS();

  const getTomorrowsWorkout = () => {
    if (!user || !todaysWorkout) return 'Push';
    return 'Push';
  }

  // Metronome beep effect
  useEffect(() => {
    if (cadenceInterval) {
      clearInterval(cadenceInterval);
      setCadenceInterval(null);
    }

    if (cadenceActive) {
      playBeep();
      const cadencePhrase = ttsPhaseService.getCadencePhrase(tier === 'mastery' ? 'mastery' : 'momentum');
      speak(cadencePhrase, 'exercise');
      
      const interval = setInterval(() => {
        playBeep();
      }, 2000);
      setCadenceInterval(interval);
      console.log('🎵 Cadence interval started:', interval);
    } else {
      console.log('🎵 Cadence stopped');
    }

    return () => {};
  }, [cadenceActive, hasFeature, tier, speak]);

  // Cleanup cadence interval
  useEffect(() => {
    if (!cadenceActive && cadenceInterval) {
      console.log('🎵 Cleaning up cadence interval:', cadenceInterval);
      clearInterval(cadenceInterval);
      setCadenceInterval(null);
    }
  }, [cadenceActive, cadenceInterval]);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (restTimer?.isActive && restTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (!prev || prev.timeLeft <= 1) {
            console.log('⏰ Rest timer finished - transitioning to next exercise');
            return null;
          }
          
          const newTimeLeft = prev.timeLeft - 1;
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
      setRestTimerInterval(interval);
    } else {
      if (restTimerInterval) {
        clearInterval(restTimerInterval);
        setRestTimerInterval(null);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        setRestTimerInterval(null);
      }
    };
  }, [restTimer?.isActive]);
  
  // Rest timer countdown effects
  useEffect(() => {
    if (!restTimer?.isActive || cadenceActive) return;
    
    const timeLeft = restTimer.timeLeft;
    const nextExerciseIndex = restTimer.exerciseIndex + 1;
    
    if (nextExerciseIndex >= exercises.length) return;
    
    const nextExercise = exercises[nextExerciseIndex];
    console.log(`⏰ Rest timer: ${timeLeft}s remaining (${90 - timeLeft}s elapsed) for next exercise: ${nextExercise.name}`);
    
    const timeElapsed = 90 - timeLeft;
    
    if (timeElapsed === 84) {
      console.log('⏰ TTS: Speaking "three" at 84 seconds ELAPSED (6 seconds remaining)');
      speak('three', 'countdown');
    } else if (timeElapsed === 86) {
      console.log('⏰ TTS: Speaking "two" at 86 seconds ELAPSED (4 seconds remaining)');
      speak('two', 'countdown');
    } else if (timeElapsed === 88) {
      console.log('⏰ TTS: Speaking "one" at 88 seconds ELAPSED (2 seconds remaining)');
      speak('one', 'countdown');
      setCadenceActive(true);
      console.log('🎵 Starting cadence for next exercise prep during final countdown');
    } else if (timeElapsed === 80) {
      const leadInPhrase = `Get ready for ${nextExercise.name} in`;
      console.log(`⏰ TTS: Speaking lead-in phrase at 80 seconds ELAPSED (10 seconds remaining): "${leadInPhrase}"`);
      speak(leadInPhrase, 'rest');
    }
  }, [restTimer?.timeLeft, restTimer?.isActive, cadenceActive, restTimer?.exerciseIndex, exercises, tier, speak, setCadenceActive]);

  // Auto-start next exercise when rest timer finishes
  useEffect(() => {
    if (restTimer === null && exercises.length > 0) {
      const completedExercises = Object.entries(exerciseStates)
        .filter(([_, state]) => state === 'completed')
        .map(([index, _]) => parseInt(index));
      
      if (completedExercises.length > 0) {
        const lastCompletedIndex = Math.max(...completedExercises);
        const nextExerciseIndex = lastCompletedIndex + 1;
        
        if (nextExerciseIndex < exercises.length && 
            (!exerciseStates[nextExerciseIndex] || exerciseStates[nextExerciseIndex] === 'idle')) {
          
          console.log(`🚀 Rest timer finished! Auto-starting next exercise: ${exercises[nextExerciseIndex].exercise_name} (index ${nextExerciseIndex})`);
          
          setTimeout(() => {
            startExercise(nextExerciseIndex);
          }, 500);
        }
      }
    }
  }, [restTimer, exercises, exerciseStates]);

  useEffect(() => {
    console.log('useEffect running, setting mounted to true')
    
    const getUser = async () => {
      console.log('🔍 Starting getUser function...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        return
      }
      
      console.log('👤 User data:', user)
      
      if (user) {
        setUser(user)
        announceToScreenReader('Welcome to X3 Tracker. Loading your workout data.')
        
        console.log('📅 Fetching user profile for ID:', user.id)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('x3_start_date')
          .eq('id', user.id)
          .single()
        
        console.log('📊 Profile data:', profile)
        console.log('❌ Profile error:', profileError)
        
        if (profileError) {
          console.error('❌ Error fetching profile:', profileError)
          if (profileError.code === 'PGRST116') {
            console.log('🆕 Creating new profile with today as start date...')
            const today = (() => {
              const now = new Date();
              return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            })()
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                x3_start_date: today
              })
            
            if (insertError) {
              console.error('❌ Error creating profile:', insertError)
            } else {
              console.log('✅ Profile created successfully')
              const workout = getTodaysWorkout(today)
              setTodaysWorkout(workout)
            }
          }
        } else if (profile?.x3_start_date) {
          console.log('✅ Found start date:', profile.x3_start_date)
          const workout = getTodaysWorkout(profile.x3_start_date)
          setTodaysWorkout(workout)
        } else {
          console.log('⚠️ No start date found in profile')
        }
      } else {
        console.log('👤 No user found')
      }
    }
    
    getUser()
  }, [])

  useEffect(() => {
    if (user && todaysWorkout && todaysWorkout.workoutType !== 'Rest') {
      console.log('🏋️ Setting up exercises for workout type:', todaysWorkout.workoutType)
      setupExercises(todaysWorkout.workoutType as 'Push' | 'Pull')
      announceToScreenReader(`Today's ${todaysWorkout.workoutType} workout is ready. Week ${todaysWorkout.week}.`)
    } else if (user && todaysWorkout && todaysWorkout.workoutType === 'Rest') {
      announceToScreenReader(`Today is a rest day. Week ${todaysWorkout.week}.`)
    }
  }, [user, todaysWorkout])

  const setupExercises = async (workoutType: 'Push' | 'Pull') => {
    if (!user?.id) {
      console.log('No user ID available yet')
      return
    }
    
    console.log('Setting up exercises for:', workoutType, 'User ID:', user.id)
    
    const exerciseNames = X3_EXERCISES[workoutType]
    
    console.log('Looking for exercises:', exerciseNames)
    
    const { data: previousData, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_type', workoutType)
      .order('workout_local_date_time', { ascending: false })
      .limit(16)
    
    console.log('Previous workout data:', previousData)
    console.log('Query error:', error)
    
    const exerciseData = exerciseNames.map(name => {
      const previous = previousData?.find(p => p.exercise_name === name);
      return {
        id: previous?.id || '',
        exercise_name: name,
        band_color: previous?.band_color || 'White',
        full_reps: previous?.full_reps || 0,
        partial_reps: previous?.partial_reps || 0,
        notes: '',
        saved: false,
        previousData: previous || null,
        workout_local_date_time: previous?.workout_local_date_time || '',
        name: name,
        band: previous?.band_color || 'White',
        fullReps: previous?.full_reps || 0,
        partialReps: previous?.partial_reps || 0,
        lastWorkout: previous ? `${previous.full_reps}+${previous.partial_reps} reps with ${previous.band_color} band` : '',
        lastWorkoutDate: previous ? formatWorkoutDate(previous.workout_local_date_time) : ''
      };
    });
    
    console.log('Final exercise data:', exerciseData)
    setExercises(exerciseData)
    
    if (previousData && previousData.length > 0) {
      const lastWorkoutDate = formatWorkoutDate(previousData[0].workout_local_date_time)
      announceToScreenReader(`Previous ${workoutType} workout data loaded from ${lastWorkoutDate}`)
    }
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value, saved: false }
    if (!newExercises[index].workout_local_date_time) {
      newExercises[index].workout_local_date_time = getLocalISODateTime()
    }
    setExercises(newExercises)
    
    if (cadenceActive) {
      console.log('🎵 Stopping cadence from updateExercise');
      setCadenceActive(false)
      announceToScreenReader('Cadence stopped')
    }

    if (field === 'band') {
      announceToScreenReader(`${newExercises[index].name} band changed to ${value}`)
    } else if (field === 'fullReps' || field === 'partialReps') {
      announceToScreenReader(`${newExercises[index].name} ${field.replace('_', ' ')} set to ${value}`)
    }
  }

  const startExercise = async (index: number) => {
    const exercise = exercises[index]
    
    console.log('🚀 Starting exercise:', exercise.name)
    
    setExerciseStates(prev => ({ ...prev, [index]: 'started' }))
    setExerciseLoadingStates(prev => ({ ...prev, [index]: true }))
    
    try {
      if (hasFeature('ttsAudioCues')) {
        setTtsActiveStates(prev => ({ ...prev, [index]: true }))
        
        const startPhrase = ttsPhaseService.getExerciseStartPhrase(
          exercise.name, 
          tier === 'mastery' ? 'mastery' : 'momentum'
        )
        
        await speak(startPhrase, 'exercise')
        
        setTtsActiveStates(prev => ({ ...prev, [index]: false }))
        
        announceToScreenReader(`Starting ${exercise.name} with audio guidance. Exercise is now in progress.`, 'assertive')
      } else {
        announceToScreenReader(`Starting ${exercise.name}. Exercise is now in progress.`, 'assertive')
      }
      
      setExerciseStates(prev => ({ ...prev, [index]: 'in_progress' }))
      
      if (!cadenceActive) {
        setCadenceActive(true)
        console.log('🎵 Auto-starting cadence for exercise')
      }
      
    } catch (error) {
      console.error('Error starting exercise:', error)
      setExerciseStates(prev => ({ ...prev, [index]: 'idle' }))
      setTtsActiveStates(prev => ({ ...prev, [index]: false }))
    } finally {
      setExerciseLoadingStates(prev => ({ ...prev, [index]: false }))
    }
  }

  const saveExercise = async (index: number) => {
    console.log('💾 Starting save for exercise index:', index)
    
    setSaveLoadingStates(prev => ({ ...prev, [index]: true }))
    setSaveErrorStates(prev => ({ ...prev, [index]: null }))
    
    if (!user || !todaysWorkout) {
      console.error('❌ Missing user or todaysWorkout:', { user: !!user, todaysWorkout: !!todaysWorkout })
      setSaveLoadingStates(prev => ({ ...prev, [index]: false }))
      setSaveErrorStates(prev => ({ ...prev, [index]: 'Missing user or workout data. Please refresh the page.' }))
      return
    }

    const exercise = exercises[index]
    console.log('🔍 Exercise object:', exercise)
    
    const workoutLocalDateTime = getLocalISODateTime()
    console.log('🕒 Using fresh timestamp:', workoutLocalDateTime)

    announceToScreenReader('Saving exercise data...', 'assertive')

    const dataToSave = {
      user_id: user.id,
      workout_local_date_time: workoutLocalDateTime,
      workout_type: todaysWorkout.workoutType,
      week_number: todaysWorkout.week,
      exercise_name: exercise.name,
      band_color: exercise.band,
      full_reps: exercise.fullReps,
      partial_reps: exercise.partialReps,
      notes: exercise.notes
    }
    
    console.log('💾 Data being sent to Supabase:', dataToSave)
    
    let data, error
    
    if (testModeService.shouldMockWorkouts()) {
      console.log('🧪 Test Mode: Intercepting workout save, adding to mock data')
      
      testModeService.addMockWorkout({
        date: workoutLocalDateTime.split('T')[0],
        workout_type: todaysWorkout.workoutType,
        exercises: [{
          exercise_name: exercise.name,
          band_color: exercise.band,
          full_reps: exercise.fullReps,
          partial_reps: exercise.partialReps
        }]
      })
      
      data = [{ ...dataToSave, id: `test-${Date.now()}` }]
      error = null
      
      console.log('🧪 Test Mode: Mock save successful')
    } else {
      const result = await supabase
        .from('workout_exercises')
        .insert(dataToSave)
        .select()
      
      data = result.data
      error = result.error
    }

    console.log('📤 Supabase response data:', data)
    console.log('❌ Supabase error:', error)

    if (!error) {
      const newExercises = [...exercises]
      newExercises[index].saved = true
      setExercises(newExercises)
      setExerciseStates(prev => ({ ...prev, [index]: 'completed' }))
      setRefreshTrigger(prev => prev + 1)
      console.log('✅ Exercise saved successfully!')
      announceToScreenReader(`${exercise.name} saved successfully!`, 'assertive')
      
      setSaveLoadingStates(prev => ({ ...prev, [index]: false }))
      setSaveErrorStates(prev => ({ ...prev, [index]: null }))
      
      if (cadenceActive) {
        console.log('🎵 Stopping cadence after exercise save')
        setCadenceActive(false)
        announceToScreenReader('Cadence stopped')
      }
      
      const nextIndex = index + 1
      const isLastExercise = nextIndex >= exercises.length
      
      console.log(`🎯 Context Detection: Exercise ${index + 1} of ${exercises.length} (${exercise.name})`);
      console.log(`🎯 Next index: ${nextIndex}, Is last exercise: ${isLastExercise}`);
      
      if (hasFeature('ttsAudioCues')) {
        if (isLastExercise) {
          console.log('🎉 TTS Context: WORKOUT COMPLETION');
          const nextWorkoutType = getTomorrowsWorkout()
          const completionPhrase = ttsPhaseService.getWorkoutCompletionPhrase(
            todaysWorkout.workoutType, 
            nextWorkoutType, 
            tier === 'mastery' ? 'mastery' : 'momentum'
          )
          console.log(`🎉 Speaking completion phrase: "${completionPhrase}" with exercise context`);
          speak(completionPhrase, 'exercise')
        } else {
          console.log('🔄 TTS Context: EXERCISE TRANSITION');
          const nextExercise = exercises[nextIndex]?.name || "your next exercise"
          console.log(`🔄 Transitioning from ${exercise.name} to ${nextExercise}`);
          const transitionPhrase = ttsPhaseService.getExerciseTransitionPhrase(
            exercise.name,
            nextExercise,
            tier === 'mastery' ? 'mastery' : 'momentum'
          )
          console.log(`🔄 Speaking transition phrase: "${transitionPhrase}" with exercise context`);
          speak(transitionPhrase, 'exercise')
        }
      }
      
      if (hasFeature('restTimer') && !isLastExercise) {
        setRestTimer({
          isActive: true,
          timeLeft: 90,
          exerciseIndex: index
        })
      }
    } else {
      console.error('❌ Error saving exercise:', error)
      
      setSaveLoadingStates(prev => ({ ...prev, [index]: false }))
      
      let errorMessage = 'Unknown error occurred. Please try again.'
      if (error) {
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        if (error.code === 'PGRST116') {
          errorMessage = 'No database connection. Please check your internet connection.'
        } else if (error.message?.includes('duplicate')) {
          errorMessage = 'This exercise has already been saved for today.'
        } else if (error.message?.includes('permission')) {
          errorMessage = 'Permission denied. Please sign out and back in.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        announceToScreenReader(`Error saving exercise: ${errorMessage}`, 'assertive')
      } else {
        console.error('❌ Unknown error occurred')
        announceToScreenReader('Unknown error saving exercise. Please try again.', 'assertive')
      }
      
      setSaveErrorStates(prev => ({ ...prev, [index]: errorMessage }))
    }
  }

  const retrySaveExercise = (index: number) => {
    console.log('🔄 Retrying save for exercise index:', index)
    saveExercise(index)
  }

  if (!todaysWorkout) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen brand-gradient">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="brand-card text-center max-w-md mx-4">
              <div className="mb-6">
                <X3MomentumWordmark size="md" className="mx-auto mb-4" />
                <h2 className="text-subhead mb-2 text-secondary">Loading...</h2>
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
      </ProtectedRoute>
    )
  }

  if (todaysWorkout.workoutType === 'Rest') {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <main>
              <div className="max-w-2xl mx-auto">
                <div className="brand-card text-center">
                  <div className="text-6xl mb-6" role="img" aria-label="Rest day relaxation emoji">🛋️</div>
                  <h1 className="text-headline mb-4 brand-gold">Today&apos;s Rest Day</h1>
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
      </ProtectedRoute>
    );
  }

  const CadenceButtonComponent = (
    <CadenceButton cadenceActive={cadenceActive} setCadenceActive={setCadenceActive} />
  );

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
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

          <div className="brand-card text-center mb-8">
            <h1 className="text-headline mb-2">
              Today&apos;s <span className="brand-fire">{todaysWorkout.workoutType}</span> <span className="brand-ember">Workout</span>
            </h1>
            <p className="text-body">Week <span className="brand-gold font-bold">{todaysWorkout.week}</span> • <span className="italic">&quot;Train to failure, not to a number&quot;</span></p>
          </div>

          {hasFeature('ttsAudioCues') && (
            <div className="brand-card text-center mb-4">
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
              {!ttsError && !ttsLoading && (
                <p className="text-body-small text-gray-600 mt-1">
                  Audio guidance ready for exercises
                </p>
              )}
            </div>
          )}

          <div className="brand-card text-center mb-8">
            <h3 className="text-body-large mb-4">🎵 Workout Cadence</h3>
            {CadenceButtonComponent}
            <p id="cadence-description" className="text-body-small text-secondary mt-2">
              Audio metronome to help maintain proper exercise timing
            </p>
          </div>

          {restTimer && hasFeature('restTimer') && (
            <div className="brand-card text-center mb-8">
              <h3 className="text-body-large mb-4">⏱️ Rest Timer</h3>
              <div className="text-4xl font-bold brand-fire mb-2">
                {Math.floor(restTimer.timeLeft / 60)}:{(restTimer.timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-body-small text-secondary mb-3">
                Rest period for {exercises[restTimer.exerciseIndex]?.name}
              </p>
              <button
                onClick={() => setRestTimer(null)}
                className="btn-secondary"
              >
                Skip Rest
              </button>
              <p className="text-body-small text-secondary mt-2">
                90-second rest period • Premium feature
              </p>
            </div>
          )}

          <main>
            <h2 className="sr-only">Exercise tracking cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.name}
                  exercise={exercise}
                  index={index}
                  exerciseState={exerciseStates[index] || 'idle'}
                  isLoading={exerciseLoadingStates[index] || false}
                  isSaveLoading={saveLoadingStates[index] || false}
                  saveError={saveErrorStates[index] || null}
                  ttsActive={ttsActiveStates[index] || false}
                  bandColors={BAND_COLORS}
                  onUpdateExercise={updateExercise}
                  onStartExercise={startExercise}
                  onSaveExercise={saveExercise}
                  onRetrySave={retrySaveExercise}
                />
              ))}
            </div>
          </main>

          <div className="mt-8">
            <WorkoutHistory 
              refreshTrigger={refreshTrigger}
              maxDisplay={2}
              defaultRange="last-two"
              showTitle={true}
              compact={true}
            />
          </div>

          <CoachChat
            currentExercise={exercises.find((ex, index) => !ex.saved) ? {
              name: exercises.find((ex, index) => !ex.saved)?.name || '',
              band: exercises.find((ex, index) => !ex.saved)?.band || '',
              fullReps: exercises.find((ex, index) => !ex.saved)?.fullReps || 0,
              partialReps: exercises.find((ex, index) => !ex.saved)?.partialReps || 0,
              notes: exercises.find((ex, index) => !ex.saved)?.notes || ''
            } : undefined}
            workoutContext={{
              workoutType: todaysWorkout.workoutType,
              week: todaysWorkout.week,
              exercisesCompleted: exercises.filter(ex => ex.saved).length,
              totalExercises: exercises.length
            }}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
