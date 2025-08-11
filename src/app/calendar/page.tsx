'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase } from '@/lib/supabase'
import { ensureTodaysEntry, markMissedWorkouts, getWorkoutForDateFromLog, calculateWorkoutForDate } from '@/lib/daily-workout-log'
import { ChevronLeft, ChevronRight, Flame, Dumbbell, Coffee, CheckCircle, AlertTriangle } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface WorkoutDay {
  date: string
  dayOfMonth: number
  workoutType: 'Push' | 'Pull' | 'Rest' | 'Missed'
  originalWorkout: 'Push' | 'Pull' | 'Rest' | 'Missed'
  isCompleted: boolean
  isToday: boolean
  isThisMonth: boolean
  week: number
  isShifted: boolean
  status: 'complete' | 'partial' | 'missed' | 'scheduled'
}

export default function CalendarPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [userStartDate, setUserStartDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('x3_start_date')
        .eq('id', userId)
        .single()

      if (profile?.x3_start_date) {
        setUserStartDate(profile.x3_start_date)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const generateCalendarData = useCallback(async () => {
    if (!userStartDate || !user) return

    console.log('📅 Generating calendar data...')
    
    let dailyWorkouts: any[] | null = null
    let workoutExercises: any[] | null = null
    let startDate: Date
    let endDate: Date
    let year: number
    let month: number
    
    try {
      // Ensure today's entry exists and mark any missed workouts
      await ensureTodaysEntry(user.id)
      await markMissedWorkouts(user.id)
      
      year = currentDate.getFullYear()
      month = currentDate.getMonth()
      
      const firstDayOfMonth = new Date(year, month, 1)
      const startDayOfWeek = firstDayOfMonth.getDay()
      
      startDate = new Date(firstDayOfMonth)
      startDate.setDate(startDate.getDate() - startDayOfWeek)

      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 34)

      // Get workout data from both tables
      const dailyWorkoutsResult = await supabase
        .from('daily_workout_log')
        .select('date, workout_type, week_number, status')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      const workoutExercisesResult = await supabase
        .from('workout_exercises')
        .select('workout_local_date_time, workout_type, week_number')
        .eq('user_id', user.id)
        .gte('workout_local_date_time', startDate.toISOString().split('T')[0] + 'T00:00:00')
        .lte('workout_local_date_time', endDate.toISOString().split('T')[0] + 'T23:59:59')
      
      dailyWorkouts = dailyWorkoutsResult.data
      workoutExercises = workoutExercisesResult.data
        
      console.log(`📊 Loaded ${dailyWorkouts?.length || 0} daily log entries and ${workoutExercises?.length || 0} exercise entries`)
      console.log('📅 Daily workouts data:', dailyWorkouts?.slice(0, 5)) // Show first 5 entries for debugging
    } catch (error) {
      console.error('❌ Error in calendar data generation:', error)
      return
    }

    // Create a map of actual workout dates from workout_exercises
    const exercisesByDate: Record<string, { workout_type: string; week_number: number }> = {}
    if (workoutExercises) {
      workoutExercises.forEach(exercise => {
        const date = new Date(exercise.workout_local_date_time).toLocaleDateString('en-CA')
        if (!exercisesByDate[date]) {
          exercisesByDate[date] = {
            workout_type: exercise.workout_type,
            week_number: exercise.week_number
          }
        }
      })
    }

    // Create a map from daily_workout_log
    const dailyWorkoutsByDate: Record<string, { workout_type: string; week_number: number; status: string }> = {}
    if (dailyWorkouts) {
      dailyWorkouts.forEach(workout => {
        dailyWorkoutsByDate[workout.date] = {
          workout_type: workout.workout_type,
          week_number: workout.week_number,
          status: workout.status
        }
      })
    }

    // Dynamic workout calculation based on daily_workout_log (single source of truth)
    const getWorkoutForDate = async (date: string) => {
      const today = new Date().toLocaleDateString('en-CA')
      
      // Debug logging for today's date
      if (date === today) {
        console.log(`🔍 Getting workout for TODAY (${date}):`)
        console.log('  - dailyWorkoutsByDate keys:', Object.keys(dailyWorkoutsByDate))
        console.log('  - Daily workout entry for today:', dailyWorkoutsByDate[date])
        console.log('  - All dailyWorkoutsByDate:', dailyWorkoutsByDate)
      }
      
      // Use dynamic calculation for all dates
      const dynamicWorkout = await calculateWorkoutForDate(user.id, date)
      
      // For completed workouts, check if they actually have exercise data
      const hasExerciseData = exercisesByDate[date] !== undefined
      const isActuallyCompleted = dynamicWorkout.status === 'completed' && 
                                 (dynamicWorkout.workoutType === 'Rest' || hasExerciseData)
      
      return {
        workoutType: dynamicWorkout.workoutType as 'Push' | 'Pull' | 'Rest' | 'Missed',
        week: dynamicWorkout.week,
        isCompleted: isActuallyCompleted,
        status: isActuallyCompleted ? 'complete' as const : 
                dynamicWorkout.status === 'completed' ? 'missed' as const :
                dynamicWorkout.status as 'scheduled'
      }
    }

    // Generate calendar days
    const calendarDays: WorkoutDay[] = []
    const today = new Date().toLocaleDateString('en-CA')
    
    // Generate all workout info async
    const workoutPromises: Promise<any>[] = []
    const dateInfos: { dateStr: string, isThisMonth: boolean, dayOfMonth: number }[] = []
    
    for (let i = 0; i < 35; i++) {
      const currentCalendarDate = new Date(startDate)
      currentCalendarDate.setDate(startDate.getDate() + i)
      
      const dateStr = currentCalendarDate.toLocaleDateString('en-CA')
      const isThisMonth = currentCalendarDate.getMonth() === month
      const dayOfMonth = currentCalendarDate.getDate()
      
      dateInfos.push({ dateStr, isThisMonth, dayOfMonth })
      workoutPromises.push(getWorkoutForDate(dateStr))
    }
    
    // Wait for all workout calculations to complete
    const workoutInfos = await Promise.all(workoutPromises)
    
    // Build calendar days with the results
    for (let i = 0; i < dateInfos.length; i++) {
      const { dateStr, isThisMonth, dayOfMonth } = dateInfos[i]
      const workoutInfo = workoutInfos[i]
      
      calendarDays.push({
        date: dateStr,
        dayOfMonth,
        workoutType: workoutInfo.workoutType,
        originalWorkout: workoutInfo.workoutType,
        isCompleted: workoutInfo.isCompleted,
        isToday: dateStr === today,
        isThisMonth: isThisMonth,
        week: workoutInfo.week,
        isShifted: false,
        status: workoutInfo.status
      })
    }
    
    setWorkoutDays(calendarDays)
  }, [currentDate, userStartDate, user])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadUserData(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (userStartDate && user) {
      generateCalendarData()
    }
  }, [generateCalendarData, userStartDate, user])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getWorkoutIcon = (type: 'Push' | 'Pull' | 'Rest' | 'Missed') => {
    switch (type) {
      case 'Push':
        return <Dumbbell size={16} className="text-orange-400" />
      case 'Pull':
        return <Flame size={16} className="text-red-400" />
      case 'Rest':
        return <Coffee size={16} className="text-blue-400" />
      case 'Missed':
        return <AlertTriangle size={16} className="text-gray-400" />
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Calendar">
          <div className="p-8">
            <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold brand-fire mb-4">
                Loading Calendar...
              </h2>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!userStartDate) {
    return (
      <ProtectedRoute>
        <AppLayout title="Calendar">
          <div className="p-8">
            <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold brand-fire mb-4">Set Your Start Date</h2>
              <p className="text-gray-300">Complete your first workout to initialize your X3 calendar</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <ProtectedRoute>
      <AppLayout title="Calendar">
        <div className="p-8">
          <main>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">
                <span className="brand-fire">{monthName.split(' ')[0]}</span> <span className="brand-ember">{monthName.split(' ')[1]}</span>
              </h1>
            </div>

            <div className="bg-gray-100 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-gray-300 dark:border-white/20">
              <div className="grid grid-cols-7 gap-3 mb-4 max-w-4xl mx-auto">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors border border-gray-400 dark:border-white/20 flex-shrink-0"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>

                <div className="grid grid-cols-7 gap-3 w-full max-w-4xl">
                  {workoutDays.map((day) => (
                    <div
                      key={day.date}
                      className={`
                        relative min-h-[80px] p-3 rounded-lg border-2 transition-all duration-200
                        ${day.isThisMonth ? '' : 'opacity-50'}
                        ${day.isToday ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900' : ''}
                        ${day.workoutType === 'Push' ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/30' : ''}
                        ${day.workoutType === 'Pull' ? 'border-red-500 bg-red-100 dark:bg-red-900/30' : ''}
                        ${day.workoutType === 'Rest' ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30' : ''}
                        ${day.workoutType === 'Missed' ? 'border-gray-500 bg-gray-100 dark:bg-gray-900/30' : ''}
                        ${day.isCompleted && day.workoutType !== 'Missed' ? 'border-green-500' : ''}
                        ${day.isShifted && day.isThisMonth ? 'ring-1 ring-yellow-400' : ''}
                      `}
                    >
                      <div className="flex flex-col h-full">
                        <span className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">
                          {day.dayOfMonth}
                        </span>
                        
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="flex items-center space-x-1 mb-1">
                            {getWorkoutIcon(day.workoutType)}
                            <span className={`text-xs font-medium ${
                              day.workoutType === 'Rest' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : day.workoutType === 'Push' 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : day.workoutType === 'Missed'
                                ? 'text-gray-600 dark:text-gray-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {day.workoutType}
                            </span>
                          </div>
                          
                          {day.isThisMonth && (
                            <span className="text-xs opacity-80 text-gray-700 dark:text-gray-300">
                              W{day.week}
                            </span>
                          )}
                        </div>
                        
                        {day.isCompleted && day.workoutType !== 'Missed' && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle size={16} className="text-green-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigateMonth('next')}
                  className="p-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors border border-gray-400 dark:border-white/20 flex-shrink-0"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}