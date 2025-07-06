'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, getTodaysWorkout, X3_EXERCISES } from '@/lib/supabase'
import { Target, Trophy, TrendingUp, Plus, CheckCircle, Calendar, Flame, Award, Star, Clock, BarChart } from 'lucide-react'

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
      const { data: { user }, error } = await supabase.auth.getUser()
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
        return <Trophy size={20} className="text-yellow-400" />
      default:
        return <Target size={20} className="text-purple-400" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return 'bg-orange-500/20 border-orange-500 text-orange-400'
      case 'consistency':
        return 'bg-blue-500/20 border-blue-500 text-blue-400'
      case 'milestone':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      default:
        return 'bg-purple-500/20 border-purple-500 text-purple-400'
    }
  }

  const activeGoals = goals.filter(g => !g.isCompleted)
  const completedGoals = goals.filter(g => g.isCompleted)

  if (loading) {
    return (
      <AppLayout title="Goals">
        <div className="p-8">
          <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold brand-fire mb-4">Loading Goals...</h2>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout title="Goals">
        <div className="p-8">
          <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold brand-fire mb-4">Please Sign In</h2>
            <p className="text-gray-600">Sign in to set and track your fitness goals</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Goals">
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Your <span className="brand-fire">Goals</span></h1>
          <p className="text-gray-400 mt-2">Track your progress and achieve your fitness milestones</p>
        </header>

        <main className="max-w-6xl mx-auto">
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="brand-card rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart size={24} className="text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{userStats.totalWorkouts}</div>
                <div className="text-sm text-gray-600">Total Workouts</div>
              </div>

              <div className="brand-card rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar size={24} className="text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{userStats.currentWeek}</div>
                <div className="text-sm text-gray-600">Current Week</div>
              </div>

              <div className="brand-card rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Flame size={24} className="text-green-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{userStats.currentStreak}</div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </div>

              <div className="brand-card rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy size={24} className="text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{userStats.longestStreak}</div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-300 mb-6">
            <button
              className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-200 ${
                activeTab === 'active'
                  ? 'border-b-4 border-orange-500 text-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active Goals ({activeGoals.length})
            </button>
            <button
              className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-200 ${
                activeTab === 'completed'
                  ? 'border-b-4 border-orange-500 text-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({completedGoals.length})
            </button>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === 'active' && activeGoals.map((goal) => (
              <div key={goal.id} className="brand-card rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(goal.category)}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{goal.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {goal.currentValue}/{goal.targetValue}
                    </div>
                    <div className="text-sm text-gray-600">{goal.unit}</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{goal.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(getProgressPercentage(goal.currentValue, goal.targetValue))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(goal.currentValue, goal.targetValue)}%` }}
                    />
                  </div>
                </div>

                {goal.targetDate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-1" />
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}

            {activeTab === 'completed' && completedGoals.map((goal) => (
              <div key={goal.id} className="brand-card rounded-xl p-6 opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={20} className="text-green-400" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{goal.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {goal.currentValue}/{goal.targetValue}
                    </div>
                    <div className="text-sm text-gray-600">{goal.unit}</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{goal.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-semibold">✓ Completed</span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy size={16} className="mr-1" />
                    Achievement Unlocked!
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Motivational Section */}
          <div className="mt-12 brand-card rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Keep Pushing Forward!</h2>
            <p className="text-gray-600 mb-6">
              Every workout brings you closer to your goals. Stay consistent, stay motivated, and watch your progress soar.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <div className="text-xl font-bold text-orange-500">
                  {userStats ? Math.round((userStats.totalWorkouts / 30) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">to 30 workouts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-500">
                  {userStats ? Math.round((userStats.currentWeek / 12) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">to 12 weeks</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}