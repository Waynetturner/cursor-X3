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

    // Generate 42 days (6 weeks × 7 days)
    const calendarDays: WorkoutDay[] = []
    const today = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })()
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      const workout = getWorkoutForDate(userStartDate, dateStr)
      const isThisMonth = currentDate.getMonth() === month
      
      calendarDays.push({
        date: dateStr,
        dayOfMonth: currentDate.getDate(),
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
  }

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
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">X3 Calendar</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <span className="text-xl font-semibold text-white">{monthName}</span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </header>

          <main>
            {/* Calendar Grid */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-300 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {workoutDays.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square p-2 rounded-lg border-2 transition-all duration-200
                      ${day.isThisMonth ? 'bg-white/5' : 'bg-white/2 opacity-50'}
                      ${day.isToday ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-900' : ''}
                      ${getWorkoutTypeColor(day.workoutType, day.isCompleted)}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`text-sm font-medium ${day.isThisMonth ? 'text-white' : 'text-gray-400'}`}>
                        {day.dayOfMonth}
                      </span>
                      <div className="mt-1">
                        {getWorkoutIcon(day.workoutType)}
                      </div>
                      {day.isCompleted && (
                        <CheckCircle size={12} className="text-green-400 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">Legend</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Dumbbell size={16} className="text-orange-400" />
                  <span className="text-gray-300">Push Workout</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flame size={16} className="text-red-400" />
                  <span className="text-gray-300">Pull Workout</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Coffee size={16} className="text-blue-400" />
                  <span className="text-gray-300">Rest Day</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}