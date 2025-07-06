'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { supabase, getTodaysWorkout } from '@/lib/supabase'
import { BarChart3, TrendingUp, Calendar, Target, Flame, Trophy } from 'lucide-react'

interface WorkoutStats {
  totalWorkouts: number
  currentWeek: number
  currentStreak: number
  longestStreak: number
  totalExercises: number
  averageRepsPerExercise: number
  mostUsedBand: string
  workoutsByType: {
    Push: number
    Pull: number
  }
  recentWorkouts: Array<{
    date: string
    type: string
    exercises: number
  }>
}

export default function StatsPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadStats(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadStats = async (userId: string) => {
    try {
      // Get all workout exercises for the user
      const { data: exercises, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('workout_local_date_time', { ascending: false })

      if (error) throw error

      if (!exercises || exercises.length === 0) {
        setStats({
          totalWorkouts: 0,
          currentWeek: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalExercises: 0,
          averageRepsPerExercise: 0,
          mostUsedBand: 'White',
          workoutsByType: { Push: 0, Pull: 0 },
          recentWorkouts: []
        })
        return
      }

      // Get user profile for current week calculation
      const { data: profile } = await supabase
        .from('profiles')
        .select('x3_start_date')
        .eq('id', userId)
        .single()

      const currentWeek = profile?.x3_start_date 
        ? getTodaysWorkout(profile.x3_start_date).week 
        : 1

      // Calculate stats
      const workoutDates = [...new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))]
      const totalWorkouts = workoutDates.length

      // Calculate streak
      const sortedDates = workoutDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0

      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i])
        const expectedDate = new Date()
        expectedDate.setDate(expectedDate.getDate() - i)
        
        if (currentDate.toDateString() === expectedDate.toDateString()) {
          tempStreak++
          currentStreak = tempStreak
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak
          tempStreak = 0
          if (i === 0) currentStreak = 0
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak

      // Band usage
      const bandCounts = exercises.reduce((acc: any, ex) => {
        acc[ex.band_color] = (acc[ex.band_color] || 0) + 1
        return acc
      }, {})
      const mostUsedBand = Object.keys(bandCounts).reduce((a, b) => 
        bandCounts[a] > bandCounts[b] ? a : b, 'White')

      // Workout types
      const workoutsByType = exercises.reduce((acc: any, ex) => {
        if (ex.workout_type === 'Push' || ex.workout_type === 'Pull') {
          acc[ex.workout_type] = (acc[ex.workout_type] || 0) + 1
        }
        return acc
      }, { Push: 0, Pull: 0 })

      // Average reps
      const totalReps = exercises.reduce((sum, ex) => sum + (ex.full_reps || 0) + (ex.partial_reps || 0), 0)
      const averageRepsPerExercise = exercises.length > 0 ? Math.round(totalReps / exercises.length) : 0

      // Recent workouts
      const recentWorkouts = sortedDates.slice(0, 5).map(date => {
        const dayExercises = exercises.filter(e => e.workout_local_date_time.startsWith(date))
        return {
          date,
          type: dayExercises[0]?.workout_type || 'Mixed',
          exercises: [...new Set(dayExercises.map(e => e.exercise_name))].length
        }
      })

      setStats({
        totalWorkouts,
        currentWeek,
        currentStreak,
        longestStreak,
        totalExercises: exercises.length,
        averageRepsPerExercise,
        mostUsedBand,
        workoutsByType,
        recentWorkouts
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Stats">
        <div className="p-8">
          <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold brand-yellow mb-4">Loading Stats...</h2>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout title="Stats">
        <div className="p-8">
          <div className="brand-card text-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold brand-yellow mb-4">Please Sign In</h2>
            <p className="text-gray-300">Sign in to view your workout statistics</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Stats">
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Workout <span className="brand-yellow">Statistics</span></h1>
          <p className="text-gray-400 mt-2">Track your X3 progress and achievements</p>
        </header>
        
        <main className="max-w-6xl mx-auto">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="brand-card text-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-yellow-400" size={24} />
                </div>
                <span className="text-3xl font-bold brand-yellow">{stats?.totalWorkouts || 0}</span>
              </div>
              <h3 className="font-semibold text-yellow-400">Total Workouts</h3>
              <p className="text-sm text-gray-400">Sessions completed</p>
            </div>

            <div className="brand-card text-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-400/20 rounded-xl flex items-center justify-center">
                  <Calendar className="text-orange-400" size={24} />
                </div>
                <span className="text-3xl font-bold text-orange-400">{stats?.currentWeek || 1}</span>
              </div>
              <h3 className="font-semibold text-orange-400">Current Week</h3>
              <p className="text-sm text-gray-400">X3 program week</p>
            </div>

            <div className="brand-card text-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center">
                  <Flame className="text-green-400" size={24} />
                </div>
                <span className="text-3xl font-bold text-green-400">{stats?.currentStreak || 0}</span>
              </div>
              <h3 className="font-semibold text-green-400">Current Streak</h3>
              <p className="text-sm text-gray-400">Days in a row</p>
            </div>

            <div className="brand-card text-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-400/20 rounded-xl flex items-center justify-center">
                  <Trophy className="text-purple-400" size={24} />
                </div>
                <span className="text-3xl font-bold text-purple-400">{stats?.longestStreak || 0}</span>
              </div>
              <h3 className="font-semibold text-purple-400">Best Streak</h3>
              <p className="text-sm text-gray-400">Personal record</p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Workout Breakdown */}
            <div className="brand-card text-gray-100 rounded-2xl p-6">
              <h2 className="text-xl font-bold brand-yellow mb-4">Workout Breakdown</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Push Workouts:</span>
                  <span className="font-bold brand-fire">{stats?.workoutsByType.Push || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Pull Workouts:</span>
                  <span className="font-bold brand-ember">{stats?.workoutsByType.Pull || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Exercises:</span>
                  <span className="font-bold text-gray-100">{stats?.totalExercises || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Reps/Exercise:</span>
                  <span className="font-bold text-gray-100">{stats?.averageRepsPerExercise || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Most Used Band:</span>
                  <span className="font-bold brand-yellow">{stats?.mostUsedBand || 'White'}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="brand-card text-gray-100 rounded-2xl p-6">
              <h2 className="text-xl font-bold brand-yellow mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {stats?.recentWorkouts.map((workout, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-100">
                        {workout.type} Workout
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(workout.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold brand-yellow">{workout.exercises}</p>
                      <p className="text-xs text-gray-400">exercises</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-400 italic">No recent workouts found</p>
                )}
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="mt-8 brand-card text-gray-100 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold brand-yellow mb-2">Keep Going!</h2>
            <p className="text-gray-300">
              {stats?.totalWorkouts === 0 
                ? "Start your first workout to see your progress here!"
                : stats?.currentStreak === 0
                ? "Get back on track - consistency is key to X3 success!"
                : `Great job maintaining a ${stats.currentStreak}-day streak! Keep building momentum.`
              }
            </p>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}