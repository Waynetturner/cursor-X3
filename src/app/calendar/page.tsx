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
import ManualLogButton from '@/components/ManualLogButton'

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

  // Generate calendar data
  const generateCalendarData = useCallback(async () => {
    if (!userStartDate || !user || !currentDate) return
    
    try {
      const today = await getUserToday(user.id)
      
      // Calculate calendar display range (5 weeks for calendar view)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDayOfMonth = new Date(year, month, 1)
      const startDayOfWeek = firstDayOfMonth.getDay()
      
      const calendarStart = new Date(firstDayOfMonth)
      calendarStart.setDate(calendarStart.getDate() - startDayOfWeek)
      
      const startDateStr = calendarStart.toLocaleDateString('en-CA')
      const endDate = new Date(calendarStart)
      endDate.setDate(calendarStart.getDate() + 34)
      const endDateStr = endDate.toLocaleDateString('en-CA')
      
      // Run maintenance functions
      await Promise.all([
        ensureTodaysEntry(),
        markMissedWorkouts()
      ])

      // Get all workouts for display range
      const { data: existingWorkouts } = await supabase
        .from('daily_workout_log')
        .select('date, workout_type, week_number, status')
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date')
      
      // Create lookup map
      const workoutMap: Record<string, any> = {}
      existingWorkouts?.forEach(workout => {
        workoutMap[workout.date] = workout
      })

      // Get last completed workout to know where we are in the sequence
      const { data: lastCompleted } = await supabase
        .from('daily_workout_log')
        .select('date, workout_type, week_number')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1)

      const lastWorkout = lastCompleted?.[0]
      
      // Week 5+ pattern (used for weeks 5-12 and beyond)
      const PATTERN = ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest'] as const
      
      // Generate calendar days
      const calendarDays: WorkoutDay[] = []
      
      for (let i = 0; i < 35; i++) {
        const currentDay = new Date(calendarStart)
        currentDay.setDate(calendarStart.getDate() + i)
        const dateStr = currentDay.toLocaleDateString('en-CA')
        const isThisMonth = currentDay.getMonth() === month
        const dayOfMonth = currentDay.getDate()
        
        let workoutInfo: {
          workoutType: 'Push' | 'Pull' | 'Rest' | 'Missed'
          week: number
          status: 'completed' | 'partial' | 'missed' | 'scheduled'
        }
        
        // First check if we have data in database
        if (workoutMap[dateStr]) {
          workoutInfo = {
            workoutType: workoutMap[dateStr].workout_type,
            week: workoutMap[dateStr].week_number,
            status: workoutMap[dateStr].status
          }
        } 
        // If no data and it's a future date, calculate what it should be
        else if (dateStr >= userStartDate && lastWorkout) {
          // Calculate days since last workout
          const lastDate = new Date(lastWorkout.date)
          const targetDate = new Date(dateStr)
          const daysDiff = Math.floor((targetDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff > 0) {
            // Find where the last workout was in the pattern
            let lastIndex = -1
            // Search backwards to find the most recent matching position
            for (let j = PATTERN.length - 1; j >= 0; j--) {
              if (PATTERN[j] === lastWorkout.workout_type) {
                lastIndex = j
                break
              }
            }
            
            // If we can't find it in pattern (shouldn't happen), start at 0
            if (lastIndex === -1) lastIndex = 0
            
            // Calculate new position and week
            let newIndex = (lastIndex + daysDiff) % PATTERN.length
            let weeksToAdd = Math.floor((lastIndex + daysDiff) / PATTERN.length)
            let newWeek = lastWorkout.week_number + weeksToAdd
            
            // After week 12, continue with "Week 12+" indefinitely (perpetuity)
            // This follows the X3 program guidance to continue forever
            if (newWeek > 12) {
              newWeek = 12 // Display as "W12" but it continues forever
            }
            
            workoutInfo = {
              workoutType: PATTERN[newIndex] as 'Push' | 'Pull' | 'Rest',
              week: newWeek,
              status: dateStr < today ? 'missed' : 'scheduled'
            }
          } else {
            // Same day as last workout
            workoutInfo = {
              workoutType: lastWorkout.workout_type,
              week: lastWorkout.week_number,
              status: 'completed'
            }
          }
        }
        // Default for dates before start or if no last workout
        else {
          workoutInfo = {
            workoutType: dateStr >= userStartDate ? 'Push' : 'Rest',
            week: dateStr >= userStartDate ? 1 : 0,
            status: dateStr < today && dateStr >= userStartDate ? 'missed' : 'scheduled'
          }
        }
        
        calendarDays.push({
          date: dateStr,
          dayOfMonth: dayOfMonth,
          workoutType: workoutInfo.workoutType,
          originalWorkout: workoutInfo.workoutType,
          isCompleted: workoutInfo.status === 'completed',
          isToday: dateStr === today,
          isThisMonth: isThisMonth,
          week: workoutInfo.week,
          isShifted: false,
          status: workoutInfo.status
        })
      }
      
      setWorkoutDays(calendarDays)
      
    } catch (error) {
      console.error('Error generating calendar:', error)
    }
  }, [currentDate, userStartDate, user])

  const refreshCalendarData = () => {
    generateCalendarData()
  }

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
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1))
      return newDate
    })
  }

  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'Push': return <Dumbbell size={16} className="text-orange-400" />
      case 'Pull': return <Flame size={16} className="text-red-400" />
      case 'Rest': return <Coffee size={16} className="text-blue-400" />
      case 'Missed': return <AlertTriangle size={16} className="text-gray-400" />
      default: return null
    }
  }

  const getWorkoutTypeColor = (type: string, isCompleted: boolean) => {
    const baseColors = {
      'Push': 'border-orange-500 bg-orange-100 dark:bg-orange-900/30',
      'Pull': 'border-red-500 bg-red-100 dark:bg-red-900/30', 
      'Rest': 'border-blue-500 bg-blue-100 dark:bg-blue-900/30',
      'Missed': 'border-gray-500 bg-gray-100 dark:bg-gray-900/30'
    }
    
    let colorClass = baseColors[type] || baseColors['Rest']
    if (isCompleted && type !== 'Missed') {
      colorClass += ' border-green-500'
    }
    return colorClass
  }

  // Navigation handlers (empty for now)
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
              <h2 className="text-2xl font-bold text-orange-600 mb-4">Loading Calendar...</h2>
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
  const monthName = currentDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || ''

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
                <span className="text-gray-700">{monthName.split(' ')[1]}</span>
              </h1>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

                <h2 className="text-2xl font-bold text-gray-800">{monthName}</h2>

                <button
                  onClick={() => navigateMonth('next')}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              {/* Manual Log Button */}
              <div className="mb-6 flex justify-center">
                <ManualLogButton user={user} onLogUpdated={refreshCalendarData} />
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
                      <span className={`text-lg font-bold mb-1 ${
                        day.isThisMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.dayOfMonth}
                      </span>
                      
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="flex items-center space-x-1 mb-1">
                          {getWorkoutIcon(day.workoutType)}
                          <span className={`text-xs font-medium ${
                            day.workoutType === 'Rest' ? 'text-blue-600' : 
                            day.workoutType === 'Push' ? 'text-orange-600' : 
                            day.workoutType === 'Missed' ? 'text-gray-600' : 'text-red-600'
                          }`}>
                            {day.workoutType}
                          </span>
                        </div>
                        
                        {day.isThisMonth && day.week > 0 && (
                          <span className="text-xs text-gray-500">W{day.week}</span>
                        )}
                      </div>
                      
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