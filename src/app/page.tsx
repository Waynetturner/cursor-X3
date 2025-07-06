'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, X3_EXERCISES, BAND_COLORS, getTodaysWorkout } from '@/lib/supabase'
import { announceToScreenReader } from '@/lib/accessibility'
import { Play, Pause, Save, Info, Settings, BarChart3, Calendar, Flame, Target, Trophy, TrendingUp, Sun, Moon, Monitor } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useRouter } from 'next/navigation'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'

// Helper to get local ISO string with timezone offset
function getLocalISODateTime() {
  const now = new Date();
  const tzo = -now.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function(num: number) {
      const norm = Math.floor(Math.abs(num));
      return (norm < 10 ? '0' : '') + norm;
    };
  return now.getFullYear() +
    '-' + pad(now.getMonth() + 1) +
    '-' + pad(now.getDate()) +
    'T' + pad(now.getHours()) +
    ':' + pad(now.getMinutes()) +
    ':' + pad(now.getSeconds()) +
    dif + pad(tzo / 60) + ':' + pad(tzo % 60);
}

const bandColors = ["White", "Light Gray", "Dark Gray", "Black"];

interface StatsCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  gradient: string;
}

const StatsCard = ({ icon, value, label, sublabel, gradient }: StatsCardProps) => (
  <div className="brand-card text-center">
    <div className="flex items-center justify-center mb-4">
      {icon}
    </div>
    <div className="text-3xl font-bold text-primary mb-2">{value}</div>
    <div className="text-body-large brand-gold font-medium mb-1">{label}</div>
    <div className="text-body-small text-secondary">{sublabel}</div>
  </div>
);

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
  // All hooks must be called at the top level, in the same order, every render
  const [user, setUser] = useState<any>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [cadenceActive, setCadenceActive] = useState(false);
  const [theme, setTheme] = useState('system');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [cadenceInterval, setCadenceInterval] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const cadenceButtonRef = useRef<HTMLButtonElement>(null);

  // Navigation items
  const navItems = [
    { icon: <BarChart3 size={20} />, label: 'Stats', tooltip: 'Stats', route: '/stats' },
    { icon: <Calendar size={20} />, label: 'Calendar', tooltip: 'Calendar', route: '/calendar' },
    { icon: <Target size={20} />, label: 'Goals', tooltip: 'Goals', route: '/goals' },
    { icon: <Settings size={20} />, label: 'Settings', tooltip: 'Settings', route: '/settings', highlight: true },
  ];

  // Metronome beep effect: always call useEffect at the top level
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (cadenceActive) {
      playBeep(); // play immediately
      interval = setInterval(() => {
        playBeep();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cadenceActive]);

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
            const today = new Date().toISOString().split('T')[0]
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

  // Test database connection and table structure

  const testDatabaseConnection = async () => {
    if (!user) return
    
    try {
      console.log('🔍 Testing database connection...')
      
      // Test 1: Check if workout_exercises table exists and is accessible
      const { data: tableTest, error: tableError } = await supabase
        .from('workout_exercises')
        .select('*')
        .limit(1)
      
      console.log('📋 Table test result:', tableTest)
      console.log('❌ Table test error:', tableError)
      
      // Test 2: Check user profile table
      const { data: profileTest, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      console.log('📋 Profile table test result:', profileTest)
      console.log('❌ Profile table test error:', profileError)
    
    // Test 3: Check RLS status by trying to insert without auth context
    console.log('🔒 Testing RLS policies...')
    const { data: rlsTest, error: rlsError } = await supabase
      .from('workout_exercises')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        workout_local_date_time: new Date().toISOString(),
        workout_type: 'Push',
        week_number: 1,
        exercise_name: 'RLS_TEST',
        band_color: 'White',
        full_reps: 0,
        partial_reps: 0,
        notes: 'RLS test - should fail'
      })
    
    console.log('🔒 RLS test result:', rlsTest)
    console.log('🔒 RLS test error:', rlsError)
    
    // Test 4: Try to insert a test record with proper auth
    const testData = {
      user_id: user.id,
      workout_local_date_time: new Date().toISOString(),
      workout_type: 'Push',
      week_number: 1,
      exercise_name: 'TEST_EXERCISE',
      band_color: 'White',
      full_reps: 0,
      partial_reps: 0,
      notes: 'Test record - delete this'
    }
    
    console.log('🧪 Test data to insert:', testData)
    
    const { data: insertTest, error: insertError } = await supabase
      .from('workout_exercises')
      .insert(testData)
    
    console.log('📤 Insert test result:', insertTest)
    console.log('❌ Insert test error:', insertError)
    
    // Clean up test record
    if (!insertError) {
      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('exercise_name', 'TEST_EXERCISE')
        .eq('user_id', user.id)
      
      console.log('🧹 Cleanup error:', deleteError)
    }
    } catch (error) {
      console.error('❌ Test DB function crashed:', error)
    }
  }

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
      console.log('✅ Exercise saved successfully!')
      announceToScreenReader(`${exercise.name} saved successfully!`, 'assertive')
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

  const toggleCadence = () => {
    if (cadenceActive) {
      setCadenceActive(false)
      if (cadenceInterval) {
        clearInterval(cadenceInterval)
        setCadenceInterval(null)
      }
      announceToScreenReader('Cadence stopped')
    } else {
      setCadenceActive(true)
      announceToScreenReader('Cadence started. 1 second interval.')
      
      // Create audio context and play initial beep
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const playBeep = () => {
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
        
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.1)
      }
      
      playBeep()
      const interval = setInterval(playBeep, 1000)
      setCadenceInterval(interval)
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

  const signOut = async () => {
    announceToScreenReader('Signing out...')
    await supabase.auth.signOut()
    setUser(null)
  }



  if (!user) {
    return (
      <div className="min-h-screen brand-gradient">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="brand-card text-center max-w-md mx-4">
            <div className="mb-6">
              <X3MomentumWordmark size="md" className="mx-auto mb-4" />
              <h2 className="text-subhead mb-2 text-secondary">AI-Powered X3 Resistance Band Tracker</h2>
              <p className="text-body italic text-secondary">Motivation. Progress. Results.</p>
            </div>
            
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <Flame className="brand-fire" size={20} />
                <span className="text-body">Smart AI coaching & insights</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <BarChart3 className="brand-fire" size={20} />
                <span className="text-body">Advanced progress analytics</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Target className="brand-fire" size={20} />
                <span className="text-body">Personalized goal tracking</span>
              </div>
            </div>
            
            <button 
              onClick={signIn}
              className="w-full btn-primary focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Sign In with Google
            </button>
            
            <p className="text-label text-secondary mt-4">Get started with your X3 journey today</p>
          </div>
        </div>
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
    <div className="min-h-screen brand-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Banner - White background with fire orange wordmark */}
        <div className="hero-banner text-center mb-8">
          <X3MomentumWordmark size="lg" className="mx-auto mb-4" />
          <h2 className="text-subhead mb-2 text-secondary">AI-Powered Resistance Band Tracking</h2>
        </div>

        {/* Navigation */}
        <nav className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => router.push('/')}
            className="btn-primary flex items-center gap-2"
          >
            <Flame size={20} />
            <span>Workout</span>
          </button>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.route)}
              className="btn-secondary flex items-center gap-2"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button 
            onClick={signOut} 
            className="btn-secondary"
          >
            Sign Out
          </button>
        </nav>

        <main>
          <div className="max-w-2xl mx-auto">
            <div className="brand-card text-center">
              <div className="text-6xl mb-6" role="img" aria-label="Rest day relaxation emoji">🛋️</div>
              <h1 className="text-headline mb-4 brand-gold">Today's Rest Day</h1>
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
              <p className="text-body brand-fire font-medium mt-4">Tomorrow: Pull Workout Ready! 💪</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

  // Cadence Button Component
  const CadenceButtonComponent = (
    <CadenceButton cadenceActive={cadenceActive} setCadenceActive={setCadenceActive} />
  );


  return (
    <div className="min-h-screen brand-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Banner - White background with fire orange wordmark */}
        <div className="hero-banner text-center mb-8">
          <X3MomentumWordmark size="lg" className="mx-auto mb-4" />
          <h2 className="text-subhead mb-2 text-secondary">AI-Powered Resistance Band Tracking</h2>
        </div>

        {/* Navigation */}
        <nav className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => router.push('/')}
            className="btn-primary flex items-center gap-2"
            title="Dashboard"
            aria-label="Dashboard"
          >
            <Flame size={20} />
            <span>Workout</span>
          </button>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.route)}
              className="btn-secondary flex items-center gap-2"
              title={item.tooltip}
              aria-label={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button 
            onClick={signOut} 
            className="btn-secondary"
          >
            Sign Out
          </button>
        </nav>

        {/* Motivational Greeting */}
        <div className="brand-card text-center mb-8">
          <h1 className="text-headline mb-2">
            Today's <span className="brand-fire">{todaysWorkout.workoutType}</span> Workout
          </h1>
          <p className="text-body">Week <span className="brand-gold font-bold">{todaysWorkout.week}</span> • <span className="italic">"Train to failure, not to a number"</span></p>
        </div>

        {/* Stats Bento Grid */}
        <div className="stats-grid mb-8">
          <StatsCard 
            icon={<Flame size={32} className="brand-fire" />}
            value="7"
            label="Fire Streak"
            sublabel="days"
            gradient=""
          />
          <StatsCard 
            icon={<BarChart3 size={32} className="brand-fire" />}
            value="65%"
            label="Week Progress"
            sublabel="4/6 workouts"
            gradient=""
          />
          <StatsCard 
            icon={<Trophy size={32} className="brand-gold" />}
            value="23"
            label="Total Workouts"
            sublabel="this month"
            gradient=""
          />
          <StatsCard 
            icon={<TrendingUp size={32} className="brand-fire" />}
            value="+12%"
            label="Strength Gain"
            sublabel="this month"
            gradient=""
          />
        </div>

        {/* Cadence Control */}
        <div className="brand-card text-center mb-8">
          <h3 className="text-body-large mb-4">🎵 Workout Cadence</h3>
          {CadenceButtonComponent}
          <p id="cadence-description" className="text-body-small text-secondary mt-2">
            Audio metronome to help maintain proper exercise timing
          </p>
        </div>

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
      </div>
    </div>
  )
}