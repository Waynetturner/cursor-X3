'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, X3_EXERCISES, BAND_COLORS, getTodaysWorkout } from '@/lib/supabase'
import { announceToScreenReader, generateId } from '@/lib/accessibility'
import { Play, Pause, Save, Info, Settings, BarChart3, Calendar, Flame, Target, Trophy, TrendingUp, Sun, Moon, Monitor } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useRouter } from 'next/navigation'

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
  <div className={`rounded-2xl p-6 shadow-md border border-[#212121] hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-[#303030] text-white`}>
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>{icon}</div>
      <span className="text-3xl font-bold text-white">{value}</span>
    </div>
    <div className="mt-4">
      <p className="text-[#FFC107] font-medium">{label}</p>
      <p className="text-sm text-gray-300">{sublabel}</p>
    </div>
  </div>
);

function CadenceButton({ cadenceActive, setCadenceActive }: { cadenceActive: boolean; setCadenceActive: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <button
      onClick={() => setCadenceActive((prev) => !prev)}
      className="w-full px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 bg-[#FF6B35] text-white transform hover:scale-105"
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
    
    console.log('🔍 Testing database connection...')
    
    // Test 1: Check if workout_exercises table exists and is accessible
    const { data: tableTest, error: tableError } = await supabase
      .from('workout_exercises')
      .select('*')
      .limit(1)
    
    console.log('📋 Table test result:', tableTest)
    console.log('❌ Table test error:', tableError)
    
    // Test 2: Check if workouts table exists (this might be the old table)
    const { data: workoutsTest, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .limit(1)
    
    console.log('📋 Workouts table test result:', workoutsTest)
    console.log('❌ Workouts table test error:', workoutsError)
    
    // Test 3: Check RLS status by trying to insert without auth context
    console.log('🔒 Testing RLS policies...')
    const { data: rlsTest, error: rlsError } = await supabase
      .from('workout_exercises')
      .insert({
        user_id: 'test-user-id',
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
      
      // Also check if anything was added to the workouts table
      const { data: workoutsCheck, error: workoutsCheckError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .limit(5)
      
      console.log('📋 Recent records in workouts table:', workoutsCheck)
      console.log('❌ Workouts check error:', workoutsCheckError)
      
      // Check if there are any database triggers by looking at the timestamps
      if (checkData && checkData.length > 0 && workoutsCheck && workoutsCheck.length > 0) {
        console.log('🕐 Timestamp comparison:')
        console.log('   workout_exercises created_at:', checkData[0].created_at)
        console.log('   workouts created_at:', workoutsCheck[0].created_at)
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
      <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] via-[#FF6B35] to-[#FFC107]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-2xl p-8 text-center max-w-md mx-4">
            <h1 className="text-4xl font-bold mb-4">X3 Tracker</h1>
            <p className="mb-6 opacity-80">Track your X3 workouts with AI coaching</p>
            

            
            
            <div className="text-white/60 mb-4">or</div>
            
            <button 
              onClick={signIn}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!todaysWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] via-[#FF6B35] to-[#FFC107]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-2xl p-8 text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Loading...</h2>
            <div className="text-lg mb-4" role="status" aria-live="polite">
              {user ? 'Loading your workout...' : 'Please sign in to continue'}
            </div>
            {user && (
              <div className="text-sm opacity-60">
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
    <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] via-[#FF6B35] to-[#FFC107]">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">X3 Tracker</h1>
          <button 
            onClick={signOut} 
            className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            Sign Out
          </button>
        </header>
        <main>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-2xl p-8">
              <h2 className="text-4xl font-bold mb-4">Rest Day</h2>
              <p className="text-lg mb-8 opacity-80">Focus on recovery, hydration, and nutrition.</p>
              <div className="text-6xl mb-8" role="img" aria-label="Rest day relaxation emoji">🛋️</div>
              <p className="opacity-60">Week {todaysWorkout.week} • Day {todaysWorkout.dayInWeek + 1}</p>
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

  // Responsive navigation: sidebar on desktop, top bar on mobile
  const navItems = [
    { icon: <BarChart3 size={20} />, label: 'Stats', tooltip: 'Stats', route: '/stats' },
    { icon: <Calendar size={20} />, label: 'Calendar', tooltip: 'Calendar', route: '/calendar' },
    { icon: <Target size={20} />, label: 'Goals', tooltip: 'Goals', route: '/goals' },
    { icon: <Settings size={20} />, label: 'Settings', tooltip: 'Settings', route: '/settings', highlight: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] via-[#FF6B35] to-[#FFC107]">
      <div className="flex md:flex-row flex-col h-screen">
        {/* Navigation: sidebar on desktop, top bar on mobile */}
        <nav className="md:w-20 w-full md:h-full h-16 bg-gradient-to-b md:bg-gradient-to-b bg-gradient-to-r from-[#D32F2F] via-[#FF6B35] to-[#FFC107] flex md:flex-col flex-row items-center justify-center md:py-6 md:space-y-4 space-x-4 md:space-x-0 shadow-lg z-10">
          {/* Home/Dashboard button (Flame) */}
          <button
            onClick={() => router.push('/')}
            className="w-12 h-12 bg-white bg-opacity-40 rounded-xl flex flex-col items-center justify-center text-[#D32F2F] cursor-pointer hover:bg-opacity-60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFC107] drop-shadow-md"
            title="Dashboard"
            aria-label="Dashboard"
          >
            <Flame size={28} />
            <span className="text-xs mt-1 hidden md:block">Home</span>
          </button>
          {navItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => router.push(item.route)}
              className={`w-12 h-12 bg-white bg-opacity-40 rounded-xl flex flex-col items-center justify-center text-[#D32F2F] cursor-pointer hover:bg-opacity-60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFC107] drop-shadow-md ${item.highlight ? 'border-2 border-[#FFC107] text-[#FFC107] font-bold' : ''}`}
              title={item.tooltip}
              aria-label={item.label}
            >
              {item.icon}
              <span className="text-xs mt-1 hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>
        <main className="flex-1 p-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              Today's {todaysWorkout.workoutType} Workout
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={testDatabaseConnection}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Test DB
              </button>
              <button 
                onClick={signOut} 
                className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              >
                Sign Out
              </button>
            </div>
          </header>

          <div className="mb-8 text-center">
            <div className="bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-2xl p-6 inline-block">
              <p className="text-lg">Week {todaysWorkout.week} • "Train to failure, not to a number"</p>
            </div>
          </div>

          <div className="text-center mb-8 space-y-4">
            {CadenceButtonComponent}
            <p id="cadence-description" className="text-sm opacity-60">
              Audio metronome to help maintain proper exercise timing
            </p>
          </div>

          <main>
            <h2 className="sr-only">Exercise tracking cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {exercises.map((exercise, index) => (
                <article key={exercise.name} className="bg-white text-gray-800 border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <header className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{exercise.name}</h3>
                    <a
                      href={getExerciseInfoUrl(exercise.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 hover:text-gray-800"
                      aria-label={`Learn more about ${exercise.name} on Jaquish Biomedical website`}
                    >
                      <Info size={16} aria-hidden="true" />
                    </a>
                  </header>
                  
                  <div className="mb-4">
                    <label htmlFor={`band-${exercise.name}`} className="block text-sm font-medium mb-2 text-gray-700">
                      Band Color
                    </label>
                    <select
                      id={`band-${exercise.name}`}
                      value={exercise.band}
                      onChange={(e) => updateExercise(index, 'band', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    >
                      {BAND_COLORS.map(color => (
                        <option key={color} value={color} className="bg-white text-gray-800">
                          {color} Band
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label htmlFor={`full-reps-${exercise.name}`} className="block text-sm font-medium mb-1 text-gray-700">
                        Full Reps
                      </label>
                      <input
                        id={`full-reps-${exercise.name}`}
                        type="number"
                        value={exercise.fullReps || ''}
                        onChange={(e) => updateExercise(index, 'fullReps', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        min="0"
                        max="999"
                      />
                    </div>
                    <div>
                      <label htmlFor={`partial-reps-${exercise.name}`} className="block text-sm font-medium mb-1 text-gray-700">
                        Partial Reps
                      </label>
                      <input
                        id={`partial-reps-${exercise.name}`}
                        type="number"
                        value={exercise.partialReps || ''}
                        onChange={(e) => updateExercise(index, 'partialReps', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        min="0"
                        max="999"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor={`notes-${exercise.name}`} className="block text-sm font-medium mb-1 text-gray-700">
                      Notes & AI Coach Prompts
                    </label>
                    <textarea
                      id={`notes-${exercise.name}`}
                      value={exercise.notes}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                      rows={2}
                      placeholder="Add notes about form, difficulty, or questions for the AI coach..."
                    />
                  </div>

                  {exercise.lastWorkout && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium mb-1">
                        Last Workout: {exercise.lastWorkout}
                      </p>
                      {exercise.lastWorkoutDate && (
                        <p className="text-xs text-gray-500">
                          Date: {exercise.lastWorkoutDate}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => saveExercise(index)}
                    disabled={exercise.saved}
                    className={`w-full py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      exercise.saved
                        ? 'bg-white text-orange-500 border border-orange-500 cursor-default focus:ring-orange-500'
                        : 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500'
                    }`}
                  >
                    <Save className="inline mr-2" size={16} aria-hidden="true" />
                    {exercise.saved ? 'Saved!' : 'Save Exercise'}
                  </button>
                </article>
              ))}
            </div>
          </main>
        </main>
      </div>
    </div>
  )
}