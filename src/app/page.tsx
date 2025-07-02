'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, X3_EXERCISES, BAND_COLORS, getTodaysWorkout } from '@/lib/supabase'
import { announceToScreenReader, generateId } from '@/lib/accessibility'
import { Play, Pause, Save, Info, Settings } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [cadenceActive, setCadenceActive] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [cadenceInterval, setCadenceInterval] = useState<NodeJS.Timeout | null>(null)
  const cadenceButtonRef = useRef<HTMLButtonElement>(null)

  // Theme classes
  const bgClass = highContrast 
    ? 'min-h-screen bg-black text-white' 
    : 'min-h-screen bg-gradient-to-br from-purple-900 to-blue-900'
  
  const cardClass = highContrast
    ? 'bg-white text-black border-2 border-white'
    : 'bg-white/10 backdrop-blur-lg text-white border border-white/20'

  useEffect(() => {
    // Check for high contrast preference
    const highContrastPreference = localStorage.getItem('highContrast') === 'true'
    setHighContrast(highContrastPreference)
    
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
        workout_date: new Date().toISOString().split('T')[0],
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
      workout_date: new Date().toISOString().split('T')[0],
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
    const today = new Date().toISOString().split('T')[0]
    
    console.log('Today is:', today)
    console.log('Looking for exercises:', exerciseNames)
    
    // Get the most recent workout data for this workout type
    const { data: previousData, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_type', workoutType)
      .neq('workout_time', today)
      .order('workout_time', { ascending: false })
      .limit(4)
    
    console.log('Previous workout data:', previousData)
    console.log('Query error:', error)
    
    const exerciseData = exerciseNames.map(name => {
      const previous = previousData?.find(p => p.exercise_name === name)
      console.log(`${name} previous data:`, previous)
      
      return {
        id: generateId('exercise'),
        exercise_name: name,
        band_color: previous?.band_color || 'White',
        full_reps: previous?.full_reps || 0,
        partial_reps: previous?.partial_reps || 0,
        notes: '',
        saved: false,
        previousData: previous ? {
          full_reps: previous.full_reps,
          partial_reps: previous.partial_reps,
          band_color: previous.band_color,
workout_time: previous.workout_time
        } : null,
        workout_time: null
      }
    })
    
    console.log('Final exercise data:', exerciseData)
    setExercises(exerciseData)
    
    if (previousData && previousData.length > 0) {
const lastWorkoutDate = new Date(previousData[0].workout_time).toLocaleDateString()
      announceToScreenReader(`Previous ${workoutType} workout data loaded from ${lastWorkoutDate}`)
    }
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value, saved: false }
    if (!newExercises[index].workout_time) {
      newExercises[index].workout_time = new Date().toISOString()
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
    if (field === 'band_color') {
      announceToScreenReader(`${newExercises[index].exercise_name} band changed to ${value}`)
    } else if (field === 'full_reps' || field === 'partial_reps') {
      announceToScreenReader(`${newExercises[index].exercise_name} ${field.replace('_', ' ')} set to ${value}`)
    }
  }

  const saveExercise = async (index: number) => {
    console.log('💾 Starting save for exercise index:', index)
    
    if (!user || !todaysWorkout) {
      console.error('❌ Missing user or todaysWorkout:', { user: !!user, todaysWorkout: !!todaysWorkout })
      return
    }

    const exercise = exercises[index]
    // Use workout_time, fallback to now if not set
    const workoutTime = exercise.workout_time || new Date().toISOString()
    
    console.log('📊 Exercise data to save:', exercise)
    console.log('🕒 Workout time:', workoutTime)
    console.log('👤 User ID:', user.id)
    console.log('🏋️ Workout type:', todaysWorkout.workoutType)
    console.log('📈 Week number:', todaysWorkout.week)

    announceToScreenReader('Saving exercise data...', 'assertive')

    const dataToSave = {
      user_id: user.id,
      workout_time: workoutTime,
      workout_type: todaysWorkout.workoutType,
      week_number: todaysWorkout.week,
      exercise_name: exercise.exercise_name,
      band_color: exercise.band_color,
      full_reps: exercise.full_reps,
      partial_reps: exercise.partial_reps,
      notes: exercise.notes
    }
    
    console.log('💾 Data being sent to Supabase:', dataToSave)

    console.log('🎯 About to insert into workout_exercises table...')
    
    const { data, error } = await supabase
      .from('workout_exercises')
      .upsert(dataToSave, { 
        onConflict: 'user_id,exercise_name,workout_time' 
      })

    console.log('📤 Supabase response data:', data)
    console.log('❌ Supabase error:', error)
    
    // Let's also check what's actually in the table after the insert
    if (!error) {
      console.log('🔍 Checking what was actually saved...')
      const { data: checkData, error: checkError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_time', workoutTime)
        .eq('exercise_name', exercise.exercise_name)
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('📋 Recent records in workout_exercises:', checkData)
      console.log('❌ Check error:', checkError)
      
      // Also check if anything was added to the workouts table
      const { data: workoutsCheck, error: workoutsCheckError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_time', workoutTime)
        .order('created_at', { ascending: false })
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
      announceToScreenReader(`${exercise.exercise_name} saved successfully!`, 'assertive')
    } else {
      console.error('❌ Error saving exercise:', error)
      announceToScreenReader('Error saving exercise. Please try again.', 'assertive')
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

const toggleHighContrast = () => {
  const newValue = !highContrast
  setHighContrast(newValue)
  localStorage.setItem('highContrast', newValue.toString())
  announceToScreenReader(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`)
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

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Login error:', error)
      announceToScreenReader('Login failed. Please check your credentials.', 'assertive')
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className={bgClass}>
        <div className="flex items-center justify-center min-h-screen">
          <div className={`${cardClass} rounded-2xl p-8 text-center max-w-md mx-4`}>
            <h1 className="text-4xl font-bold mb-4">X3 Tracker</h1>
            <p className="mb-6 opacity-80">Track your X3 workouts with AI coaching</p>
            

            <form onSubmit={signInWithEmail} className="space-y-4 mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
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
      <div className={bgClass}>
        <div className="flex items-center justify-center min-h-screen">
          <div className={`${cardClass} rounded-2xl p-8 text-center max-w-md mx-4`}>
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
    <div className={bgClass}>
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
            <div className={`${cardClass} rounded-2xl p-8`}>
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

  return (
    <div className={bgClass}>
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Today's {todaysWorkout.workoutType} Workout
          </h1>
<button 
  onClick={signOut} 
  className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
>
  Sign Out
</button>
<Link href="/settings" className="p-2 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Settings">
  <Settings size={22} />
</Link>
        </header>

        <div className="mb-8 text-center">
          <div className={`${cardClass} rounded-2xl p-6 inline-block`}>
            <p className="text-lg">Week {todaysWorkout.week} • "Train to failure, not to a number"</p>
          </div>
        </div>

        <div className="text-center mb-8 space-y-4">
          <button
            ref={cadenceButtonRef}
            onClick={toggleCadence}
            className={`px-8 py-4 rounded-2xl font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              cadenceActive 
                ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500' 
                : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500'
            }`}
            aria-describedby="cadence-description"
          >
            {cadenceActive ? <Pause className="inline mr-2" size={20} aria-hidden="true" /> : <Play className="inline mr-2" size={20} aria-hidden="true" />}
            {cadenceActive ? 'Stop Cadence' : 'Start Cadence (1s)'}
          </button>
          <p id="cadence-description" className="text-sm opacity-60">
            Audio metronome to help maintain proper exercise timing
          </p>

        </div>

        <main>
          <h2 className="sr-only">Exercise tracking cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exercises.map((exercise, index) => (
              <article key={exercise.id} className={`${cardClass} rounded-2xl p-6`}>
                <header className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{exercise.exercise_name}</h3>
                  <a
                    href={getExerciseInfoUrl(exercise.exercise_name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Learn more about ${exercise.exercise_name} on Jaquish Biomedical website`}
                  >
                    <Info size={16} aria-hidden="true" />
                  </a>
                </header>
                
                <div className="mb-4">
                  <label htmlFor={`band-${exercise.id}`} className="block text-sm font-medium mb-2 opacity-80">
                    Band Color
                  </label>
                  <select
                    id={`band-${exercise.id}`}
                    value={exercise.band_color}
                    onChange={(e) => updateExercise(index, 'band_color', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BAND_COLORS.map(color => (
                      <option key={color} value={color} className="bg-gray-800 text-white">
                        {color} Band
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label htmlFor={`full-reps-${exercise.id}`} className="block text-sm font-medium mb-1 opacity-80">
                      Full Reps
                    </label>
                    <input
                      id={`full-reps-${exercise.id}`}
                      type="number"
                      value={exercise.full_reps || ''}
                      onChange={(e) => updateExercise(index, 'full_reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="999"
                    />
                  </div>
                  <div>
                    <label htmlFor={`partial-reps-${exercise.id}`} className="block text-sm font-medium mb-1 opacity-80">
                      Partial Reps
                    </label>
                    <input
                      id={`partial-reps-${exercise.id}`}
                      type="number"
                      value={exercise.partial_reps || ''}
                      onChange={(e) => updateExercise(index, 'partial_reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="999"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor={`notes-${exercise.id}`} className="block text-sm font-medium mb-1 opacity-80">
                    Notes
                  </label>
                  <textarea
                    id={`notes-${exercise.id}`}
                    value={exercise.notes}
                    onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Add notes about form, difficulty, etc."
                  />
                </div>

                {exercise.previousData && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-white/80 mb-1">
Last time ({new Date(exercise.previousData.workout_time).toLocaleDateString()}):
                    </p>
                    <p className="text-sm text-white/60">
                      {exercise.previousData.full_reps}+{exercise.previousData.partial_reps} reps with {exercise.previousData.band_color} band
                    </p>
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
      </div>
    </div>
  )
}