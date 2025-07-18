'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, getWorkoutForDate, X3_EXERCISES } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Flame, Dumbbell, Coffee, CheckCircle } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface WorkoutDay {
  date: string
  dayOfMonth: number
  workoutType: 'Push' | 'Pull' | 'Rest'
  isCompleted: boolean
  isToday: boolean
  isThisMonth: boolean
  week: number
}

export default function CalendarPage() {
  const [user, setUser] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set())
  const [userStartDate, setUserStartDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    if (userStartDate) {
      generateCalendarData()
    }
  }, [currentDate, userStartDate, completedWorkouts])

  const loadUserData = async (userId: string) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('x3_start_date')
        .eq('id', userId)
        .single()

      if (profile?.x3_start_date) {
        setUserStartDate(profile.x3_start_date)
      }

      // Get completed workouts
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('workout_local_date_time')
        .eq('user_id', userId)

      if (exercises) {
        const completed = new Set(
          exercises.map(e => {
            // Extract date portion directly from stored timestamp to avoid timezone conversion
            return e.workout_local_date_time.split('T')[0];
          })
        )
        setCompletedWorkouts(completed)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const generateCalendarData = () => {
    if (!userStartDate) return

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Get first day of month and determine starting date for calendar
    const firstDayOfMonth = new Date(year, month, 1)
    const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the first date to show (might be from previous month)
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(startDate.getDate() - startDayOfWeek)

    // Generate 35 days (5 weeks × 7 days) instead of 42
    const calendarDays: WorkoutDay[] = []
    const today = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })()
    
    for (let i = 0; i < 35; i++) {
      const currentCalendarDate = new Date(startDate)
      currentCalendarDate.setDate(startDate.getDate() + i)
      
      const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(currentCalendarDate.getDate()).padStart(2, '0')}`
      const workout = getWorkoutForDate(userStartDate, dateStr)
      const isThisMonth = currentCalendarDate.getMonth() === month
      
      calendarDays.push({
        date: dateStr,
        dayOfMonth: currentCalendarDate.getDate(),
        workoutType: workout.workoutType,
        isCompleted: completedWorkouts.has(dateStr),
        isToday: dateStr === today,
        isThisMonth: isThisMonth,
        week: workout.week
      })
    }

    setWorkoutDays(calendarDays)
  }

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

  const getWorkoutIcon = (type: 'Push' | 'Pull' | 'Rest') => {
    switch (type) {
      case 'Push':
        return <Dumbbell size={16} className="text-orange-400" />
      case 'Pull':
        return <Flame size={16} className="text-red-400" />
      case 'Rest':
        return <Coffee size={16} className="text-blue-400" />
    }
  }

  const getWorkoutTypeColor = (type: 'Push' | 'Pull' | 'Rest', isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-500/20 border-green-500 text-green-400'
    
    switch (type) {
      case 'Push':
        return 'bg-orange-500/20 border-orange-500 text-orange-400'
      case 'Pull':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'Rest':
        return 'bg-blue-500/20 border-blue-500 text-blue-400'
    }
  } // ← Make sure this closing brace exists!

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Calendar">
          <div className="p-8">
            <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold brand-fire mb-4">Loading Calendar...</h2>
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
            {/* Month Name - Centered and Large */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">
                <span className="brand-fire">{monthName.split(' ')[0]}</span> <span className="brand-ember">{monthName.split(' ')[1]}</span>
              </h1>
            </div>

            {/* Calendar Grid */}
            <div className="bg-gray-100 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-gray-300 dark:border-white/20">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-3 mb-4 max-w-4xl mx-auto">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar with Navigation - Fixed Sizing */}
              <div className="flex items-center justify-center gap-6">
                {/* Left Chevron */}
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors border border-gray-400 dark:border-white/20 flex-shrink-0"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>

                {/* Calendar Days - Full Width */}
                <div className="grid grid-cols-7 gap-3 w-full max-w-4xl">
                  {workoutDays.map((day, index) => (
                    <div
                      key={day.date}
                      className={`
                        relative min-h-[80px] p-3 rounded-lg border-2 transition-all duration-200
                        ${day.isThisMonth ? '' : 'opacity-50'}
                        ${day.isToday ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900' : ''}
                        ${day.workoutType === 'Push' ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/30' : ''}
                        ${day.workoutType === 'Pull' ? 'border-red-500 bg-red-100 dark:bg-red-900/30' : ''}
                        ${day.workoutType === 'Rest' ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30' : ''}
                        ${day.isCompleted ? 'border-green-500' : ''}
                      `}
                    >
                      <div className="flex flex-col h-full">
                        {/* Day Number */}
                        <span className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">
                          {day.dayOfMonth}
                        </span>
                        
                        {/* Workout Type */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="flex items-center space-x-1 mb-1">
                            {getWorkoutIcon(day.workoutType)}
                            <span className={`text-xs font-medium ${
                              day.workoutType === 'Rest' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : day.workoutType === 'Push' 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {day.workoutType}
                            </span>
                          </div>
                          
                          {/* Week indicator for current month */}
                          {day.isThisMonth && (
                            <span className="text-xs opacity-80 text-gray-700 dark:text-gray-300">
                              W{day.week}
                            </span>
                          )}
                        </div>
                        
                        {/* Completion Status */}
                        {day.isCompleted && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle size={16} className="text-green-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Chevron */}
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
