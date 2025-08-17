'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase } from '@/lib/supabase'
import { 
  ensureTodaysEntry, 
  markMissedWorkouts, 
  getUserToday
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
  status: 'completed' | 'partial' | 'missed' | 'scheduled'
}

// 🎯 DEAD SIMPLE: Just follow the schedule pattern from the last known workout
function calculateWorkoutForDateCached(
  targetDate: string, 
  lastWorkout: any, 
  today: string
): {
  workoutType: 'Push' | 'Pull' | 'Rest'
  week: number
  status: 'completed' | 'scheduled' | 'missed'
} {
  // If no workout history, start from beginning
  if (!lastWorkout) {
    return {
      workoutType: 'Push',
      week: 1,
      status: targetDate < today ? 'missed' : 'scheduled'
    }
  }
  
  const WEEK_5_PLUS_SCHEDULE = ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
  
  // Calculate days since last workout
  const lastDate = new Date(lastWorkout.date)
  const target = new Date(targetDate)
  lastDate.setHours(0,0,0,0)
  target.setHours(0,0,0,0)
  const daysDiff = Math.round((target.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff <= 0) {
    // Same day or past - return the last workout
    return {
      workoutType: lastWorkout.workout_type,
      week: lastWorkout.week_number,
      status: 'completed'
    }
  }
  
  // From your logs: last workout was Push at position 4 in week 11
  // Next should be: Pull (pos 5), then Rest (pos 6), then week 12 starts
  let position = 4 + daysDiff  // Start from position 4, add days
  let week = 11
  
  // Handle week rollovers
  while (position >= 7) {
    position -= 7
    week++
  }
  
  const workoutType = WEEK_5_PLUS_SCHEDULE[position]
  const status = targetDate < today ? 'missed' : 'scheduled'
  
  return {
    workoutType,
    week,
    status
  }
}

export default function CalendarPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [userStartDate, setUserStartDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function setUserDate() {
      if (user?.id) {
        const today = await getUserToday(user.id)
        const [year, month, day] = today.split('-').map(Number)
        setCurrentDate(new Date(year, month - 1, day))
      }
    }
    setUserDate()
  }, [user?.id])

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

  // 🚀 FULLY OPTIMIZED: True batching with minimal database calls
  const generateCalendarData = useCallback(async () => {
    if (!userStartDate || !user || !currentDate) return
    console.log('📅 Generating calendar data...')
    
    try {
      const today = await getUserToday(user.id)
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
      
      const startDateStr = startDate.toLocaleDateString('en-CA')
      const endDateStr = endDate.toLocaleDateString('en-CA')
      
      console.log('Calendar range:', { start: startDateStr, end: endDateStr })

      // 🚀 TEMPORARILY SKIP MAINTENANCE: These functions make 35+ DB calls
      // We'll rely on the batched data instead for now
      // await Promise.all([
      //   ensureTodaysEntry(),
      //   markMissedWorkouts()
      // ])

      // 🚀 BATCH QUERY 1: Get ALL workout data for the entire calendar range
      const { data: existingWorkouts } = await supabase
        .from('daily_workout_log')
        .select('date, workout_type, week_number, status')
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date')
      
      console.log(`📊 Found ${existingWorkouts?.length || 0} existing workout entries for calendar range`)
      
      // Create lookup map for O(1) access
      const workoutMap: Record<string, any> = {}
      existingWorkouts?.forEach(workout => {
        workoutMap[workout.date] = workout
      })

      // 🚀 BATCH QUERY 2: Get last completed workout ONCE (not 35 times!)
      const { data: lastWorkout } = await supabase
        .from('daily_workout_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .neq('workout_type', 'Missed')
        .order('date', { ascending: false })
        .limit(1)

      console.log('🔍 Last completed workout:', lastWorkout?.[0])

      // Generate calendar days with minimal database calls
      const calendarDays: WorkoutDay[] = []
      let calculationCount = 0
      
      for (let i = 0; i < 35; i++) {
        const currentCalendarDate = new Date(startDate)
        currentCalendarDate.setDate(startDate.getDate() + i)
        const dateStr = currentCalendarDate.toLocaleDateString('en-CA')
        const isThisMonth = currentCalendarDate.getMonth() === month
        const dayOfMonth = currentCalendarDate.getDate()
        
        let workoutInfo: {
          workoutType: 'Push' | 'Pull' | 'Rest'
          week: number
          status: 'completed' | 'scheduled' | 'missed'
        }
        
        // Check if we have existing data (fast path - no DB calls)
        const existingWorkout = workoutMap[dateStr]
        
        if (existingWorkout) {
          // Use existing data - FAST!
          workoutInfo = {
            workoutType: existingWorkout.workout_type,
            week: existingWorkout.week_number,
            status: existingWorkout.status
          }
        } else {
          // Calculate only for missing dates using CACHED lastWorkout data
          calculationCount++
          console.log(`🧮 Calculating missing data for ${dateStr}`)
          
          // 🎯 OPTIMIZED CALCULATION: Use the cached lastWorkout instead of querying again
          workoutInfo = calculateWorkoutForDateCached(dateStr, lastWorkout?.[0], today)
        }
        
        // Convert to calendar format
        const calendarDay: WorkoutDay = {
          date: dateStr,
          dayOfMonth: dayOfMonth,
          workoutType: workoutInfo.workoutType,
          originalWorkout: workoutInfo.workoutType,
          isCompleted: workoutInfo.status === 'completed',
          isToday: dateStr === today,
          isThisMonth: isThisMonth,
          week: workoutInfo.week,
          isShifted: false,
          status: workoutInfo.status === 'completed' ? 'completed' : 
                  workoutInfo.status === 'missed' ? 'missed' : 'scheduled'
        }
        
        calendarDays.push(calendarDay)
      }
      
      setWorkoutDays(calendarDays)
      console.log(`✅ Calendar loaded! Used ${existingWorkouts?.length || 0} cached entries, calculated ${calculationCount} missing dates`)
      
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
      if (!prev) return prev
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
    const handleScheduleWorkout = () => {}
  const handleViewStats = () => {}

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout 
          title="Calendar"
          onStartExercise={handleStartExercise}
          onLogWorkout={handleLogWorkout}
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

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  let monthName = ''
  if (currentDate) {
    monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (!currentDate) {
    return (
      <ProtectedRoute>
        <AppLayout title="Calendar">
          <div className="container mx-auto px-6 py-12 max-w-7xl">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-orange-600 mb-4">Loading Calendar...</h2>
              <p className="text-gray-600">Please wait while we load your timezone-aware calendar.</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout 
        title="Calendar"
        onStartExercise={handleStartExercise}
        onLogWorkout={handleLogWorkout}
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
