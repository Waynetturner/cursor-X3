'use client'

import { useState, useEffect } from 'react'
import { supabase, getTodaysWorkout, calculateStreak } from '@/lib/supabase'
import { BarChart3, Calendar, Flame, Trophy } from 'lucide-react'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'
import AppLayout from '@/components/layout/AppLayout'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

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
    exerciseDetails: Array<{
      name: string
      fullReps: number
      partialReps: number
      bandColor: string
    }>
  }>
}

export default function StatsPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
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

      // Calculate streak using the new function that includes rest days
      const currentStreak = profile?.x3_start_date 
        ? calculateStreak(profile.x3_start_date, workoutDates)
        : 0
      
      // For now, set longest streak to current streak (we can improve this later)
      const longestStreak = currentStreak

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

      // Recent workouts with individual exercise details
      const uniqueDates = [...new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))]
      const sortedDates = uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      
      const recentWorkouts = sortedDates.slice(0, 5).map(date => {
        const dayExercises = exercises.filter(e => e.workout_local_date_time.startsWith(date))
        
        return {
          date,
          type: dayExercises[0]?.workout_type || 'Mixed',
          exercises: [...new Set(dayExercises.map(e => e.exercise_name))].length,
          exerciseDetails: dayExercises.map(ex => ({
            name: ex.exercise_name,
            fullReps: ex.full_reps || 0,
            partialReps: ex.partial_reps || 0,
            bandColor: ex.band_color || 'White'
          }))
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
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="brand-card text-center">
              <h2 className="text-subhead brand-gold mb-4">Loading Stats...</h2>
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
              Workout <span className="brand-gold">Statistics</span>
            </h1>
            <p className="text-body text-secondary">Track your X3 progress and achievements</p>
          </div>
          
          <main className="max-w-6xl mx-auto">
            {/* Key Stats Bento Grid */}
            <div className="stats-grid mb-8">
              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <BarChart3 className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">Total Workouts</h3>
                <p className="text-headline brand-fire">{stats?.totalWorkouts || 0}</p>
              </div>

              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <Flame className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">Current Streak</h3>
                <p className="text-headline brand-fire">{stats?.currentStreak || 0} days</p>
              </div>

              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <Calendar className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">Current Week</h3>
                <p className="text-headline brand-fire">Week {stats?.currentWeek || 1}</p>
              </div>

              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <Trophy className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">Longest Streak</h3>
                <p className="text-headline brand-fire">{stats?.longestStreak || 0} days</p>
              </div>
            </div>

            {/* Workout History */}
            <div className="brand-card">
              <h2 className="text-subhead mb-6">Recent Workouts</h2>
              <WorkoutHistory />
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}