'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase } from '@/lib/supabase'
import { Target, Trophy, CheckCircle, Calendar, Flame, Clock, BarChart } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface Goal {
  id: string
  title: string
  description: string
  category: 'strength' | 'consistency' | 'milestone' | 'custom'
  targetValue: number
  currentValue: number
  unit: string
  targetDate?: string
  isCompleted: boolean
  createdAt: string
}

interface UserStats {
  totalWorkouts: number
  currentWeek: number
  completedThisWeek: number
  longestStreak: number
  currentStreak: number
  totalExercises: number
  startDate: string | null
}

export default function GoalsPage() {
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'create'>('active')

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

  const loadUserData = async (userId: string) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('x3_start_date')
        .eq('id', userId)
        .single()

      // Get workout data
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('workout_local_date_time', { ascending: false })

      if (exercises && profile) {
        const stats = calculateUserStats(exercises, profile.x3_start_date)
        setUserStats(stats)
        generateDefaultGoals(stats)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const calculateUserStats = (exercises: any[], startDate: string): UserStats => {
    const workoutDates = new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))
    const totalWorkouts = workoutDates.size
    
    const today = new Date()
    const start = new Date(startDate)
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const currentWeek = Math.floor(daysSinceStart / 7) + 1

    // Calculate current week progress
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    const thisWeekWorkouts = exercises.filter(e => {
      const workoutDate = new Date(e.workout_local_date_time)
      return workoutDate >= weekStart && workoutDate <= weekEnd
    })
    const completedThisWeek = new Set(thisWeekWorkouts.map(e => e.workout_local_date_time.split('T')[0])).size

    // Calculate streaks
    const sortedDates = Array.from(workoutDates).sort()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null
      
      if (prevDate && (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24) === 1) {
        tempStreak++
      } else {
        tempStreak = 1
      }
      
      longestStreak = Math.max(longestStreak, tempStreak)
      
      if (i === sortedDates.length - 1) {
        currentStreak = tempStreak
      }
    }

    return {
      totalWorkouts,
      currentWeek,
      completedThisWeek,
      longestStreak,
      currentStreak,
      totalExercises: exercises.length,
      startDate
    }
  }

  const generateDefaultGoals = (stats: UserStats) => {
    const defaultGoals: Goal[] = [
      {
        id: '1',
        title: 'Complete 30 Workouts',
        description: 'Build consistency with 30 total workout sessions',
        category: 'consistency',
        targetValue: 30,
        currentValue: stats.totalWorkouts,
        unit: 'workouts',
        isCompleted: stats.totalWorkouts >= 30,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Complete Week 12',
        description: 'Reach the 12-week milestone in your X3 journey',
        category: 'milestone',
        targetValue: 12,
        currentValue: stats.currentWeek,
        unit: 'weeks',
        isCompleted: stats.currentWeek >= 12,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: '7-Day Streak',
        description: 'Maintain consistency with 7 consecutive workout days',
        category: 'consistency',
        targetValue: 7,
        currentValue: stats.currentStreak,
        unit: 'days',
        isCompleted: stats.currentStreak >= 7,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Complete 100 Exercises',
        description: 'Log 100 individual exercise records',
        category: 'strength',
        targetValue: 100,
        currentValue: stats.totalExercises,
        unit: 'exercises',
        isCompleted: stats.totalExercises >= 100,
        createdAt: new Date().toISOString()
      }
    ]

    setGoals(defaultGoals)
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return <Flame size={20} className="text-orange-400" />
      case 'consistency':
        return <Calendar size={20} className="text-blue-400" />
      case 'milestone':
        return <Trophy size={20} className="text-orange-400" />
      default:
        return <Target size={20} className="text-purple-400" />
    }
  }


  const activeGoals = goals.filter(g => !g.isCompleted)
  const completedGoals = goals.filter(g => g.isCompleted)

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="brand-card text-center">
              <h2 className="text-subhead brand-gold mb-4">Loading Goals...</h2>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="brand-card text-center mb-8">
              <h1 className="text-headline mb-2">
                <span className="brand-fire">Your</span> <span className="brand-ember">Goals</span>
              </h1>
            <p className="text-body text-secondary">Track your progress and celebrate achievements</p>
          </div>

          <main className="max-w-6xl mx-auto">
            {/* Stats Overview */}
            {userStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="brand-card text-center">
                  <div className="flex items-center justify-center mb-4">
                    <BarChart className="brand-fire" size={32} />
                  </div>
                  <h3 className="text-body-large font-semibold mb-2">Total Workouts</h3>
                  <p className="text-headline brand-fire">{userStats.totalWorkouts}</p>
                </div>

                <div className="brand-card text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Calendar className="brand-fire" size={32} />
                  </div>
                  <h3 className="text-body-large font-semibold mb-2">Current Week</h3>
                  <p className="text-headline brand-fire">{userStats.currentWeek}</p>
                </div>

                <div className="brand-card text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Flame className="brand-fire" size={32} />
                  </div>
                  <h3 className="text-body-large font-semibold mb-2">Current Streak</h3>
                  <p className="text-headline brand-fire">{userStats.currentStreak} days</p>
                </div>

                <div className="brand-card text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Trophy className="brand-fire" size={32} />
                  </div>
                  <h3 className="text-body-large font-semibold mb-2">Longest Streak</h3>
                  <p className="text-headline brand-fire">{userStats.longestStreak} days</p>
                </div>
              </div>
            )}

            {/* Goals Tabs */}
            <div className="brand-card">
              <div className="flex space-x-1 mb-6">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    activeTab === 'active'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active Goals ({activeGoals.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    activeTab === 'completed'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed ({completedGoals.length})
                </button>
              </div>

              {/* Goals List */}
              <div className="space-y-4">
                {(activeTab === 'active' ? activeGoals : completedGoals).map((goal) => (
                  <div
                    key={goal.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        {getCategoryIcon(goal.category)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                          <p className="text-gray-600">{goal.description}</p>
                        </div>
                      </div>
                      {goal.isCompleted && (
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(goal.currentValue, goal.targetValue)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {goal.isCompleted ? (
                          <span className="text-green-600 font-medium">Goal achieved!</span>
                        ) : (
                          <span>{Math.round(getProgressPercentage(goal.currentValue, goal.targetValue))}% complete</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {activeTab === 'active' && activeGoals.length === 0 && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Goals</h3>
                  <p className="text-gray-600">All your goals have been completed! Great job!</p>
                </div>
              )}

              {activeTab === 'completed' && completedGoals.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Goals Yet</h3>
                  <p className="text-gray-600">Keep working on your active goals to see them here!</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
