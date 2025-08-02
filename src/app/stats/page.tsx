'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserStats } from '@/lib/user-stats'
import { BarChart3, Calendar, Flame, Trophy } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7days' | '1month' | '3months' | 'alltime'>('7days')

  const handleStartExercise = () => router.push('/workout')
  const handleLogWorkout = () => router.push('/workout')
  const handleAddGoal = () => router.push('/goals')
  const handleScheduleWorkout = () => router.push('/calendar')
  const handleViewStats = () => router.push('/stats')

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

  // Reload stats when time range changes
  useEffect(() => {
    if (user) {
      loadStats(user.id)
    }
  }, [timeRange, user])

  const loadStats = async (userId: string) => {
    try {
      console.log('📊 Loading stats using unified service for time range:', timeRange)
      
      // Get unified stats from single source of truth
      const userStats = await getUserStats(userId)
      
      if (!userStats) {
        console.error('❌ Failed to get user stats')
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
      
      // For time-range filtered data, we still need to query exercises
      let filteredTotalWorkouts = userStats.totalWorkouts
      let filteredTotalExercises = userStats.totalExercises
      let recentWorkouts: Array<{
        date: string
        type: string
        exercises: number
        exerciseDetails: Array<{
          name: string
          fullReps: number
          partialReps: number
          bandColor: string
        }>
      }> = []
      
      // Apply time range filter for specific stats
      if (timeRange !== 'alltime') {
        const now = new Date()
        now.setHours(23, 59, 59, 999)
        let startDate: Date
        
        switch (timeRange) {
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '1month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case '3months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
        
        startDate.setHours(0, 0, 0, 0)
        const startDateStr = startDate.toISOString().split('T')[0]
        
        // Get filtered exercises
        const { data: filteredExercises } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('user_id', userId)
          .gte('workout_local_date_time', startDateStr + 'T00:00:00')
          .order('workout_local_date_time', { ascending: false })
        
        if (filteredExercises) {
          const filteredWorkoutDates = [...new Set(filteredExercises.map(e => e.workout_local_date_time.split('T')[0]))]
          filteredTotalWorkouts = filteredWorkoutDates.length
          filteredTotalExercises = filteredExercises.length
          
          // Build recent workouts from filtered data
          const sortedDates = filteredWorkoutDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          recentWorkouts = sortedDates.slice(0, 5).map(date => {
            const dayExercises = filteredExercises.filter(e => e.workout_local_date_time.startsWith(date))
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
        }
      } else {
        // For 'alltime', build recent workouts from all data
        const { data: allExercises } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('user_id', userId)
          .order('workout_local_date_time', { ascending: false })
          .limit(50) // Limit for performance
        
        if (allExercises) {
          const allWorkoutDates = [...new Set(allExercises.map(e => e.workout_local_date_time.split('T')[0]))]
          const sortedDates = allWorkoutDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          recentWorkouts = sortedDates.slice(0, 5).map(date => {
            const dayExercises = allExercises.filter(e => e.workout_local_date_time.startsWith(date))
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
        }
      }
      
      // Use unified stats with time-range adjustments
      setStats({
        totalWorkouts: filteredTotalWorkouts,
        currentWeek: userStats.currentWeek,
        currentStreak: userStats.currentStreak, // Always from unified source
        longestStreak: userStats.longestStreak, // Always from unified source
        totalExercises: filteredTotalExercises,
        averageRepsPerExercise: userStats.averageRepsPerExercise,
        mostUsedBand: userStats.mostUsedBand,
        workoutsByType: userStats.workoutsByType,
        recentWorkouts
      })
      
      console.log('✅ Stats loaded with unified service:', {
        currentStreak: userStats.currentStreak,
        longestStreak: userStats.longestStreak,
        currentWeek: userStats.currentWeek,
        totalWorkouts: filteredTotalWorkouts
      })
      
    } catch (error) {
      console.error('❌ Error loading stats with unified service:', error)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout 
          onStartExercise={handleStartExercise}
          onLogWorkout={handleLogWorkout}
          onAddGoal={handleAddGoal}
          onScheduleWorkout={handleScheduleWorkout}
          onViewStats={handleViewStats}
          exerciseInProgress={false}
          workoutCompleted={false}
        >
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
      <AppLayout 
        onStartExercise={handleStartExercise}
        onLogWorkout={handleLogWorkout}
        onAddGoal={handleAddGoal}
        onScheduleWorkout={handleScheduleWorkout}
        onViewStats={handleViewStats}
        exerciseInProgress={false}
        workoutCompleted={false}
      >
        <div className="container mx-auto px-4 py-8">
          <main className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="brand-card text-center mb-8">
              <h1 className="text-headline mb-2">
                <span className="brand-fire">Workout</span> <span className="brand-ember">Statistics</span>
              </h1>
              <p className="text-body text-secondary">Track your X3 progress and achievements</p>
            </div>

            {/* Key Stats Bento Grid */}
            <div className="stats-grid mb-8">
              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <BarChart3 className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">
                  Workouts ({
                    timeRange === '7days' ? 'Last 7 Days' :
                    timeRange === '1month' ? 'Last Month' :
                    timeRange === '3months' ? 'Last 3 Months' : 'All Time'
                  })
                </h3>
                <p className="text-headline brand-fire">{stats?.totalWorkouts || 0}</p>
              </div>

              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <Flame className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">Current Streak</h3>
                <p className="text-headline brand-fire">{stats?.currentStreak || 0} days</p>
                <p className="text-body-small text-gray-500 mt-1">All time</p>
              </div>

              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <Calendar className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">Current Week</h3>
                <p className="text-headline brand-fire">Week {stats?.currentWeek || 1}</p>
                <p className="text-body-small text-gray-500 mt-1">Program progress</p>
              </div>

              <div className="brand-card text-center">
                <div className="flex items-center justify-center mb-4">
                  <Trophy className="brand-fire" size={32} />
                </div>
                <h3 className="text-body-large font-semibold mb-2">Longest Streak</h3>
                <p className="text-headline brand-fire">{stats?.longestStreak || 0} days</p>
                <p className="text-body-small text-gray-500 mt-1">All time</p>
              </div>
            </div>

            {/* Streak Info - Moved below the four buttons */}
            <div className="brand-card mb-8">
              <h3 className="text-body-large font-semibold mb-4">🔥 Streak Information</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-body-small text-gray-700 mb-2">
                  <strong>Current Streak:</strong> {stats?.currentStreak || 0} consecutive days following the X3 schedule
                </p>
                <p className="text-body-small text-gray-600 mb-2">
                  Your streak includes both workout days and scheduled rest days. Missing a scheduled workout breaks the streak.
                </p>
                <p className="text-body-small text-gray-600">
                  <strong>Schedule:</strong> Weeks 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest • Weeks 5+: Push/Pull/Push/Pull/Push/Pull/Rest
                </p>
              </div>
            </div>

            {/* Time Range Selector - Right above workout history */}
            <div className="brand-card mb-4">
              <h3 className="text-body-large font-semibold mb-4">Time Range</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: '7days', label: 'Last 7 Days' },
                  { key: '1month', label: 'Last Month' },
                  { key: '3months', label: 'Last 3 Months' },
                  { key: 'alltime', label: 'All Time' }
                ].map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setTimeRange(range.key as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === range.key
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workout History */}
            <div className="brand-card">
              <h2 className="text-subhead mb-6">
                {timeRange === '7days' ? 'Last 7 Days' : 
                 timeRange === '1month' ? 'Last Month' :
                 timeRange === '3months' ? 'Last 3 Months' : 'All Time'} Workouts
              </h2>
              <WorkoutHistory 
                key={timeRange} // Force re-render when time range changes
                defaultRange={
                  timeRange === '7days' ? 'week' :
                  timeRange === '1month' ? 'month' :
                  timeRange === '3months' ? '6months' : 'all'
                }
                showTitle={false}
                compact={false}
              />
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
