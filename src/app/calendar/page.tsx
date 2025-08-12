'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase } from '@/lib/supabase'
import { 
  ensureTodaysEntry, 
  markMissedWorkouts, 
  calculateWorkoutForDate,
  WEEK_1_4_SCHEDULE, 
  WEEK_5_PLUS_SCHEDULE 
} from '@/lib/daily-workout-log'
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
    
    try {
      // Get today's date in the correct format
      const today = new Date().toLocaleDateString('en-CA')
      console.log('Today is:', today)
      
      // Calculate calendar range
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      const firstDayOfMonth = new Date(year, month, 1)
      const startDayOfWeek = firstDayOfMonth.getDay()
      
      const startDate = new Date(firstDayOfMonth)
      startDate.setDate(startDate.getDate() - startDayOfWeek)

      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 34)
      
      console.log('Calendar range:', {
        start: startDate.toLocaleDateString('en-CA'),
        end: endDate.toLocaleDateString('en-CA')
      })

      await Promise.all([
        ensureTodaysEntry(user.id),
        markMissedWorkouts(user.id)
      ])
      
      // Get workout data from both tables
      const [dailyWorkoutsResult, workoutExercisesResult] = await Promise.all([
        supabase
          .from('daily_workout_log')
          .select('date, workout_type, week_number, status')
          .eq('user_id', user.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]),
        
        supabase
          .from('workout_exercises')
          .select('workout_local_date_time, workout_type, week_number')
          .eq('user_id', user.id)
          .gte('workout_local_date_time', startDate.toISOString().split('T')[0] + 'T00:00:00')
          .lte('workout_local_date_time', endDate.toISOString().split('T')[0] + 'T23:59:59')
      ])
      
      const dailyWorkouts = dailyWorkoutsResult.data
      const workoutExercises = workoutExercisesResult.data
        
      console.log(`📊 Loaded ${dailyWorkouts?.length || 0} daily log entries and ${workoutExercises?.length || 0} exercise entries`)

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

      // Generate calendar days
      const calendarDays: WorkoutDay[] = []
      // Get the last completed workout
      const { data: lastCompletedWorkout } = await supabase
        .from('daily_workout_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1)

      console.log('📅 Last completed workout:', lastCompletedWorkout?.[0])
      
      // Generate calendar days using the new dynamic calculation
      const dateInfos: { dateStr: string, isThisMonth: boolean, dayOfMonth: number }[] = []
      const workoutInfos: any[] = []
      
      for (let i = 0; i < 35; i++) {
        const currentCalendarDate = new Date(startDate)
        currentCalendarDate.setDate(startDate.getDate() + i)
        const dateStr = currentCalendarDate.toLocaleDateString('en-CA')
        const isThisMonth = currentCalendarDate.getMonth() === month
        const dayOfMonth = currentCalendarDate.getDate()
        
        dateInfos.push({ dateStr, isThisMonth, dayOfMonth })
        
        // Always use calculateWorkoutForDate to ensure consistent progression
        console.log(`Calculating workout for ${dateStr}...`)
        const workoutInfo = await calculateWorkoutForDate(user.id, dateStr)
        console.log(`Result for ${dateStr}:`, workoutInfo)
        workoutInfos.push(workoutInfo)
      }
      
      // Build calendar days with the results
      for (let i = 0; i < dateInfos.length; i++) {
        const { dateStr, isThisMonth, dayOfMonth } = dateInfos[i]
        const workoutInfo = workoutInfos[i]
        
        // For completed workouts, check if they actually have exercise data
        const hasExerciseData = exercisesByDate[dateStr] !== undefined
        const isActuallyCompleted = workoutInfo.status === 'completed' && 
                                   (workoutInfo.workoutType === 'Rest' || hasExerciseData)
        
        calendarDays.push({
          date: dateStr,
          dayOfMonth,
          workoutType: workoutInfo.workoutType,
          originalWorkout: workoutInfo.workoutType,
          isCompleted: isActuallyCompleted,
          isToday: dateStr === today,
          isThisMonth: isThisMonth,
          week: workoutInfo.week,
          isShifted: false,
          status: isActuallyCompleted ? 'complete' : 
                  workoutInfo.status === 'completed' ? 'missed' :
                  workoutInfo.status
        })
      }
      
      setWorkoutDays(calendarDays)
    } catch (error) {
      console.error('❌ Error in calendar data generation:', error)
    }
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

  const getWorkoutTypeColor = (type: 'Push' | 'Pull' | 'Rest' | 'Missed', isCompleted: boolean) => {
    const baseColors = {
      'Push': 'border-orange-500 bg-orange-100 dark:bg-orange-900/30',
      'Pull': 'border-red-500 bg-red-100 dark:bg-red-900/30', 
      'Rest': 'border-blue-500 bg-blue-100 dark:bg-blue-900/30',
      'Missed': 'border-gray-500 bg-gray-100 dark:bg-gray-900/30'
    }
    
    let colorClass = baseColors[type]
    
    if (isCompleted && type !== 'Missed') {
      colorClass += ' border-green-500'
    }
    
    return colorClass
  }

  // Navigation handlers
  const handleStartExercise = () => {}
  const handleLogWorkout = () => {}
  const handleAddGoal = () => {}
  const handleScheduleWorkout = () => {}
  const handleViewStats = () => {}

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout 
          title="Calendar"
          onStartExercise={handleStartExercise}
          onLogWorkout={handleLogWorkout}
          onAddGoal={handleAddGoal}
          onScheduleWorkout={handleScheduleWorkout}
          onViewStats={handleViewStats}
          exerciseInProgress={false}
          workoutCompleted={false}
        >
          <div className="container mx-auto px-6 py-12 max-w-7xl">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-orange-600 mb-4">
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
        <AppLayout 
          title="Calendar"
          onStartExercise={handleStartExercise}
          onLogWorkout={handleLogWorkout}
          onAddGoal={handleAddGoal}
          onScheduleWorkout={handleScheduleWorkout}
          onViewStats={handleViewStats}
          exerciseInProgress={false}
          workoutCompleted={false}
        >
          <div className="container mx-auto px-6 py-12 max-w-7xl">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-orange-600 mb-4">Set Your Start Date</h2>
              <p className="text-gray-600">Complete your first workout to initialize your X3 calendar</p>
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
      <AppLayout 
        title="Calendar"
        onStartExercise={handleStartExercise}
        onLogWorkout={handleLogWorkout}
        onAddGoal={handleAddGoal}
        onScheduleWorkout={handleScheduleWorkout}
        onViewStats={handleViewStats}
        exerciseInProgress={false}
        workoutCompleted={false}
      >
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <main>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent">
                  {monthName.split(' ')[0]}
                </span>{' '}
                <span className="text-gray-700">
                  {monthName.split(' ')[1]}
                </span>
              </h1>
            </div>

            {/* Calendar Container */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 flex items-center justify-center"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

                <h2 className="text-2xl font-bold text-gray-800">
                  {monthName}
                </h2>

                <button
                  onClick={() => navigateMonth('next')}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 flex items-center justify-center"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-3 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-3">
                {workoutDays.map((day, index) => (
                  <div
                    key={`${day.date}-${index}`}
                    className={`
                      relative min-h-[80px] p-3 rounded-lg border-2 transition-all duration-200
                      ${day.isThisMonth ? '' : 'opacity-50'}
                      ${day.isToday ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-white' : ''}
                      ${getWorkoutTypeColor(day.workoutType, day.isCompleted)}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      {/* Day Number */}
                      <span className={`text-lg font-bold mb-1 ${
                        day.isThisMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.dayOfMonth}
                      </span>
                      
                      {/* Workout Type */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="flex items-center space-x-1 mb-1">
                          {getWorkoutIcon(day.workoutType)}
                          <span className={`text-xs font-medium ${
                            day.workoutType === 'Rest' 
                              ? 'text-blue-600' 
                              : day.workoutType === 'Push' 
                              ? 'text-orange-600' 
                              : day.workoutType === 'Missed'
                              ? 'text-gray-600'
                              : 'text-red-600'
                          }`}>
                            {day.workoutType}
                          </span>
                        </div>
                        
                        {/* Week indicator for current month */}
                        {day.isThisMonth && (
                          <span className="text-xs text-gray-500">
                            W{day.week}
                          </span>
                        )}
                      </div>
                      
                      {/* Completion Status */}
                      {day.isCompleted && day.workoutType !== 'Missed' && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle size={16} className="text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}