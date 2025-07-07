'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, getWorkoutForDate, X3_EXERCISES } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Flame, Dumbbell, Coffee, CheckCircle } from 'lucide-react'

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
          exercises.map(e => e.workout_local_date_time.split('T')[0])
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
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    // Generate calendar grid (6 weeks)
    const calendarDays: WorkoutDay[] = []
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const workout = getWorkoutForDate(userStartDate, dateStr)
      
      calendarDays.push({
        date: dateStr,
        dayOfMonth: date.getDate(),
        workoutType: workout.workoutType,
        isCompleted: completedWorkouts.has(dateStr),
        isToday: false,
        isThisMonth: false,
        week: workout.week
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const workout = getWorkoutForDate(userStartDate, dateStr)
      const today = new Date().toISOString().split('T')[0]
      
      calendarDays.push({
        date: dateStr,
        dayOfMonth: day,
        workoutType: workout.workoutType,
        isCompleted: completedWorkouts.has(dateStr),
        isToday: dateStr === today,
        isThisMonth: true,
        week: workout.week
      })
    }

    // Next month days to fill grid
    const remainingDays = 42 - calendarDays.length // 6 weeks × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      const dateStr = date.toISOString().split('T')[0]
      const workout = getWorkoutForDate(userStartDate, dateStr)
      
      calendarDays.push({
        date: dateStr,
        dayOfMonth: day,
        workoutType: workout.workoutType,
        isCompleted: completedWorkouts.has(dateStr),
        isToday: false,
        isThisMonth: false,
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
      <AppLayout title="Calendar">
        <div className="p-8">
          <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold brand-fire mb-4">Loading Calendar...</h2>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout title="Calendar">
        <div className="p-8">
          <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold brand-fire mb-4">Please Sign In</h2>
            <p className="text-gray-300">Sign in to view your workout calendar</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!userStartDate) {
    return (
      <AppLayout title="Calendar">
        <div className="p-8">
          <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold brand-fire mb-4">Set Your Start Date</h2>
            <p className="text-gray-300">Complete your first workout to initialize your X3 calendar</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <AppLayout title="Calendar">
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Workout <span className="brand-fire">Calendar</span></h1>
          <p className="text-gray-400 mt-2">Track your X3 program schedule and progress</p>
        </header>

        <main className="max-w-4xl mx-auto">
          {/* Calendar Header */}
          <div className="brand-card text-gray-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h2 className="text-2xl font-bold brand-fire">{monthName}</h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500/20 border border-orange-500 rounded"></div>
                <span className="text-orange-400">Push</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/20 border border-red-500 rounded"></div>
                <span className="text-red-400">Pull</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/20 border border-blue-500 rounded"></div>
                <span className="text-blue-400">Rest</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 border border-green-500 rounded"></div>
                <span className="text-green-400">Completed</span>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-gray-400 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {workoutDays.map((day, index) => (
                <div
                  key={index}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200 min-h-[80px]
                    ${day.isThisMonth ? '' : 'opacity-50'}
                    ${day.isToday ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-800' : ''}
                    ${getWorkoutTypeColor(day.workoutType, day.isCompleted)}
                    hover:scale-105 cursor-pointer
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`font-semibold ${day.isThisMonth ? '' : 'text-gray-500'}`}>
                      {day.dayOfMonth}
                    </span>
                    {day.isCompleted && (
                      <CheckCircle size={16} className="text-green-400" />
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    {getWorkoutIcon(day.workoutType)}
                    <span className="text-xs font-medium">{day.workoutType}</span>
                    <span className="text-xs opacity-75">W{day.week}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Workout Summary */}
          {(() => {
            const today = workoutDays.find(day => day.isToday)
            if (!today) return null

            return (
              <div className="brand-card text-gray-100 rounded-2xl p-6">
                <h3 className="text-xl font-bold brand-fire mb-4">Today&apos;s Workout</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getWorkoutIcon(today.workoutType)}
                    <div>
                      <p className="font-semibold text-lg">{today.workoutType} Day</p>
                      <p className="text-gray-400">Week {today.week}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {today.isCompleted ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={20} />
                        <span className="font-semibold">Completed!</span>
                      </div>
                    ) : today.workoutType === 'Rest' ? (
                      <p className="text-blue-400 font-semibold">Recovery Day</p>
                    ) : (
                      <p className="text-gray-300">
                        {X3_EXERCISES[today.workoutType].length} exercises planned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </main>
      </div>
    </AppLayout>
  )
}