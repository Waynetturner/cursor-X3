'use client'

import { useState, useEffect } from 'react'
import { supabase, X3_EXERCISES, BAND_COLORS, getTodaysWorkout } from '@/lib/supabase'
import { announceToScreenReader } from '@/lib/accessibility'
import { Play, Pause, Save, Info, BarChart3, Flame, Target, Calendar, Settings, ArrowRight, Sparkles, TrendingUp, Users, Shield } from 'lucide-react'
import React from 'react'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'
import AppLayout from '@/components/layout/AppLayout'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import { useRouter } from 'next/navigation'

// Helper to get local ISO string with timezone offset
function getLocalISODateTime() {
  const now = new Date();
  
  // Create a timestamp that preserves the local date regardless of timezone
  // Use the local date components directly
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Get timezone offset in proper format
  const tzo = -now.getTimezoneOffset(); // Minutes difference from UTC
  const offsetHours = String(Math.floor(Math.abs(tzo) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(tzo) % 60).padStart(2, '0');
  const offsetSign = tzo >= 0 ? '+' : '-';
  
  const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
  
  console.log('🕒 Generated timestamp:', result);
  console.log('🌍 Timezone offset minutes:', now.getTimezoneOffset());
  console.log('📅 Local date components:', { year, month, day, hours, minutes, seconds });
  
  return result;
}



function CadenceButton({ cadenceActive, setCadenceActive }: { cadenceActive: boolean; setCadenceActive: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <button
      onClick={() => setCadenceActive((prev) => !prev)}
      className={`w-full px-8 py-4 font-bold flex items-center justify-center space-x-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transform hover:scale-105 ${
        cadenceActive 
          ? 'bg-ember-red hover:bg-red-600 text-white border-none' 
          : 'btn-primary'
      }`}
      style={cadenceActive ? { background: 'var(--ember-red)' } : {}}
      aria-pressed={cadenceActive}
      aria-label={cadenceActive ? 'Stop Cadence' : 'Start Cadence'}
    >
      {cadenceActive ? <Pause size={20} /> : <Play size={20} />}
      <span>{cadenceActive ? 'Stop Cadence' : 'Start Cadence (1s)'}</span>
    </button>
  );
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

// TTS function for audio cues
function speakText(text: string, hasFeature: boolean) {
  if (!hasFeature || !('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel(); // Cancel any existing speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  window.speechSynthesis.speak(utterance);
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

export default function HomePage() {


  const [user, setUser] = useState<any>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [cadenceActive, setCadenceActive] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [cadenceInterval, setCadenceInterval] = useState<NodeJS.Timeout | null>(null);
  const [restTimer, setRestTimer] = useState<{ isActive: boolean; timeLeft: number; exerciseIndex: number } | null>(null);
  const [restTimerInterval, setRestTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { hasFeature } = useSubscription();
  const router = useRouter();
  const getTomorrowsWorkout = () => {
    if (!user || !todaysWorkout) return 'Push';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    return 'Push';
  }

  // Metronome beep effect: always call useEffect at the top level
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (cadenceActive) {
      playBeep(); // play immediately
      speakText("Cadence started. 2 second intervals for proper form", hasFeature('ttsAudioCues'));
      interval = setInterval(() => {
        playBeep();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cadenceActive, hasFeature]);

  // Rest timer effect
  useEffect(() => {
    if (restTimer?.isActive && restTimer.timeLeft > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => {
          if (!prev || prev.timeLeft <= 1) {
            // Timer finished
            speakText("Rest period complete. Ready for your next exercise", hasFeature('ttsAudioCues'));
            return null;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
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
      if (restTimerInterval) {
        clearInterval(restTimerInterval);
      }
    };
  }, [restTimer, hasFeature, restTimerInterval]);

  useEffect(() => {
    console.log('useEffect running, setting mounted to true')
    
    // Get user and setup
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
        
        // Get user's start date
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
          // If profile doesn't exist, create one with today's date
          if (profileError.code === 'PGRST116') {
            console.log('🆕 Creating new profile with today as start date...')
            // Use local date to avoid timezone issues
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

  // Separate useEffect to handle workout setup when user and todaysWorkout are available
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
    
    // Get the most recent workout data for this workout type (no date filter)
    const { data: previousData, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_type', workoutType)
      .order('workout_local_date_time', { ascending: false })
      .limit(16) // get more history in case of duplicates
    
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
        // UI fields
        name: name,
        band: previous?.band_color || 'White',
        fullReps: previous?.full_reps || 0,
        partialReps: previous?.partial_reps || 0,
        lastWorkout: previous ? `${previous.full_reps}+${previous.partial_reps} reps with ${previous.band_color} band` : '',
        lastWorkoutDate: previous ? new Date(previous.workout_local_date_time).toLocaleDateString() : ''
      };
    });
    
    console.log('Final exercise data:', exerciseData)
    setExercises(exerciseData)
    
    if (previousData && previousData.length > 0) {
      const lastWorkoutDate = new Date(previousData[0].workout_local_date_time).toLocaleDateString()
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
    
    // Stop cadence if running
    if (cadenceActive) {
      setCadenceActive(false)
      if (cadenceInterval) {
        clearInterval(cadenceInterval)
        setCadenceInterval(null)
      }
      announceToScreenReader('Cadence stopped')
    }

    // Announce changes to screen readers
    if (field === 'band') {
      announceToScreenReader(`${newExercises[index].name} band changed to ${value}`)
    } else if (field === 'fullReps' || field === 'partialReps') {
      announceToScreenReader(`${newExercises[index].name} ${field.replace('_', ' ')} set to ${value}`)
    }
  }

  const saveExercise = async (index: number) => {
    console.log('💾 Starting save for exercise index:', index)
    
    if (!user || !todaysWorkout) {
      console.error('❌ Missing user or todaysWorkout:', { user: !!user, todaysWorkout: !!todaysWorkout })
      return
    }

    const exercise = exercises[index]
    console.log('🔍 Exercise object:', exercise)
    
    // Always use current timestamp to avoid duplicates
    const workoutLocalDateTime = getLocalISODateTime()
    console.log('🕒 Using fresh timestamp:', workoutLocalDateTime)
    
    console.log('📊 Exercise data to save:', exercise)
    console.log('🕒 Workout time:', workoutLocalDateTime)
    console.log('👤 User ID:', user.id)
    console.log('🏋️ Workout type:', todaysWorkout.workoutType)
    console.log('📈 Week number:', todaysWorkout.week)

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

    console.log('🎯 About to upsert into workout_exercises table...')
    
    // First, let's see what records already exist for this user/exercise
    const { data: existingRecords, error: checkError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise_name', exercise.name)
      .order('workout_local_date_time', { ascending: false })
      .limit(3)
    
    console.log('🔍 Existing records for this exercise:', existingRecords)
    console.log('🔍 Check error:', checkError)
    
    // Try a simple insert with fresh timestamp
    console.log('🚀 Attempting insert operation with fresh timestamp...')
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert(dataToSave)
      .select()

    console.log('📤 Supabase response data:', data)
    console.log('❌ Supabase error:', error)
    
    // Let's also check what's actually in the table after the insert
    if (!error) {
      console.log('🔍 Checking what was actually saved...')
      const { data: checkData, error: checkError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_local_date_time', workoutLocalDateTime)
        .eq('exercise_name', exercise.name)
        .limit(5)
      
      console.log('📋 Recent records in workout_exercises:', checkData)
      console.log('❌ Check error:', checkError)
      
      // Also check user profile
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
      
      console.log('📋 User profile:', profileCheck)
      console.log('❌ Profile check error:', profileCheckError)
      
      // Check the most recent workout data
      if (checkData && checkData.length > 0) {
        console.log('🕐 Most recent workout:')
        console.log('  Exercise:', checkData[0].exercise_name)
        console.log('  Date:', checkData[0].workout_local_date_time)
        console.log('  Type:', checkData[0].workout_type)
      }
    }

    if (!error) {
      const newExercises = [...exercises]
      newExercises[index].saved = true
      setExercises(newExercises)
      setRefreshTrigger(prev => prev + 1) // Trigger workout history refresh
      console.log('✅ Exercise saved successfully!')
      announceToScreenReader(`${exercise.name} saved successfully!`, 'assertive')
      
      // Add TTS audio cue for exercise completion
      const nextIndex = index + 1
      const isLastExercise = nextIndex >= exercises.length
      
      if (hasFeature('ttsAudioCues')) {
        if (isLastExercise) {
          // Final exercise variations
          const motivationalMessages = [
            "Great job! How are you doing?",
            "Excellent work! Tell me about your energy level",
            "Outstanding! You've completed your workout!"
          ]
          const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
          speakText(randomMessage, true)
        } else {
          const nextExercise = exercises[nextIndex]?.name || "your next exercise"
          speakText(`${exercise.name} saved and recorded. Catch your breath and get set up for ${nextExercise}`, true)
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
    } else {
      console.error('❌ Error saving exercise:', error)
      if (error) {
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        announceToScreenReader(`Error saving exercise: ${error.message || 'Unknown error'}. Please try again.`, 'assertive')
      } else {
        console.error('❌ Unknown error occurred')
        announceToScreenReader('Unknown error saving exercise. Please try again.', 'assertive')
      }
    }
  }


  const getExerciseInfoUrl = (exerciseName: string) => {
    const exerciseUrls: { [key: string]: string } = {
      'Chest Press': 'https://www.jaquishbiomedical.com/exercise/chest-press/',
      'Tricep Press': 'https://www.jaquishbiomedical.com/exercise/tricep-press/',
      'Overhead Press': 'https://www.jaquishbiomedical.com/exercise/overhead-press/',
      'Front Squat': 'https://www.jaquishbiomedical.com/exercise/front-squat/',
      'Deadlift': 'https://www.jaquishbiomedical.com/exercise/deadlift/',
      'Bent Row': 'https://www.jaquishbiomedical.com/exercise/bent-row/',
      'Bicep Curl': 'https://www.jaquishbiomedical.com/exercise/bicep-curl/',
      'Calf Raise': 'https://www.jaquishbiomedical.com/exercise/calf-raise/'
    }
    return exerciseUrls[exerciseName] || 'https://www.jaquishbiomedical.com/x3-program/'
  }

  const signIn = async () => {
    announceToScreenReader('Redirecting to sign in...')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) {
      announceToScreenReader('Sign in error. Please try again.', 'assertive')
      console.log('Error:', error)
    }
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
            <h2 className="text-subhead mb-2 text-secondary">AI-Powered X3 Resistance Band Tracker</h2>
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
                onClick={signUpWithEmail}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Get Started Free
              </button>
              <button 
                onClick={signInWithEmail}
                className="bg-white hover:bg-gray-50 text-orange-600 font-semibold py-3 px-8 rounded-lg border-2 border-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Sign In
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
    )
  }

 if (todaysWorkout.workoutType === 'Rest') {
  return (
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

  
  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  
  // Get user's start date from profile (you'll need to store this in state)
  // For now, use a simple calculation based on today's workout
  // You can get the actual start date from the profile data you already fetch
  
  // Use the getTodaysWorkout function with tomorrow's date
  // You'll need access to the user's start date here
  const tomorrowWorkout = getTodaysWorkout(userStartDate, tomorrowDateStr);
  return tomorrowWorkout.workoutType;
}

// Replace line 716 with:
const tomorrowWorkoutType = getTomorrowsWorkout();



            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}

  // Cadence Button Component
  const CadenceButtonComponent = (
    <CadenceButton cadenceActive={cadenceActive} setCadenceActive={setCadenceActive} />
  );


  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">

        {/* Motivational Greeting */}
        <div className="brand-card text-center mb-8">
          <h1 className="text-headline mb-2">
            Today&apos;s <span className="brand-fire">{todaysWorkout.workoutType}</span> Workout
          </h1>
          <p className="text-body">Week <span className="brand-gold font-bold">{todaysWorkout.week}</span> • <span className="italic">&quot;Train to failure, not to a number&quot;</span></p>
        </div>


        {/* Cadence Control */}
        <div className="brand-card text-center mb-8">
          <h3 className="text-body-large mb-4">🎵 Workout Cadence</h3>
          {CadenceButtonComponent}
          <p id="cadence-description" className="text-body-small text-secondary mt-2">
            Audio metronome to help maintain proper exercise timing
          </p>
        </div>

        {/* Rest Timer Display */}
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

        {/* Exercise Grid */}
        <main>
          <h2 className="sr-only">Exercise tracking cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exercises.map((exercise, index) => (
              <article key={exercise.name} className="brand-card">
                <header className="flex justify-between items-start mb-4">
                  <h3 className="text-body-large font-semibold brand-fire">{exercise.name}</h3>
                  <a
                    href={getExerciseInfoUrl(exercise.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-secondary hover:text-fire transition-colors"
                    aria-label={`Learn more about ${exercise.name} on Jaquish Biomedical website`}
                  >
                    <Info size={16} aria-hidden="true" />
                  </a>
                </header>
                
                <div className="mb-4">
                  <label htmlFor={`band-${exercise.name}`} className="block text-label mb-2 text-secondary">
                    Band Color
                  </label>
                  <select
                    id={`band-${exercise.name}`}
                    value={exercise.band}
                    onChange={(e) => updateExercise(index, 'band', e.target.value)}
                    className="w-full bg-white border border-subtle rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary"
                  >
                    {BAND_COLORS.map(color => (
                      <option key={color} value={color} className="bg-white text-primary">
                        {color} Band
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label htmlFor={`full-reps-${exercise.name}`} className="block text-label mb-1 text-secondary">
                      Full Reps
                    </label>
                    <input
                      id={`full-reps-${exercise.name}`}
                      type="number"
                      value={exercise.fullReps || ''}
                      onChange={(e) => updateExercise(index, 'fullReps', parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-subtle rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary"
                      min="0"
                      max="999"
                    />
                  </div>
                  <div>
                    <label htmlFor={`partial-reps-${exercise.name}`} className="block text-label mb-1 text-secondary">
                      Partial Reps
                    </label>
                    <input
                      id={`partial-reps-${exercise.name}`}
                      type="number"
                      value={exercise.partialReps || ''}
                      onChange={(e) => updateExercise(index, 'partialReps', parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-subtle rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary"
                      min="0"
                      max="999"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor={`notes-${exercise.name}`} className="block text-label mb-1 text-secondary">
                    Notes & AI Coach Prompts
                  </label>
                  <textarea
                    id={`notes-${exercise.name}`}
                    value={exercise.notes}
                    onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                    className="w-full bg-white border border-subtle rounded-xl px-3 py-2 text-body-small focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary placeholder-gray-500"
                    rows={2}
                    placeholder="Add notes about form, difficulty, or questions for the AI coach..."
                  />
                </div>

                {exercise.lastWorkout && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-subtle">
                    <p className="text-body-small text-primary font-medium mb-1">
                      Last Workout: {exercise.lastWorkout}
                    </p>
                    {exercise.lastWorkoutDate && (
                      <p className="text-label text-secondary">
                        Date: {exercise.lastWorkoutDate}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => saveExercise(index)}
                  disabled={exercise.saved}
                  className={`w-full py-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                    exercise.saved
                      ? 'btn-success cursor-default focus:ring-green-500'
                      : 'btn-primary focus:ring-orange-500'
                  }`}
                >
                  <Save className="inline mr-2" size={16} aria-hidden="true" />
                  {exercise.saved ? 'Saved!' : 'Save Exercise'}
                </button>
              </article>
            ))}
          </div>
        </main>

        {/* Recent Workouts Section */}
        <div className="mt-8">
          <WorkoutHistory 
            refreshTrigger={refreshTrigger}
            maxDisplay={2}
            defaultRange="last-two"
            showTitle={true}
            compact={true}
          />
        </div>
      </div>
    </AppLayout>
  )
}