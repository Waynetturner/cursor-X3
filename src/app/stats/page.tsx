'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { TimeRange } from '@/types/stats'
import { useUserStats } from '@/hooks/useUserStats'
import { StatsHeader } from '@/components/stats/StatsHeader'
import { StatsGrid } from '@/components/stats/StatsGrid'
import { StreakInfoSection } from '@/components/stats/StreakInfoSection'
import { TimeRangeSelector } from '@/components/stats/TimeRangeSelector'
import { WorkoutHistorySection } from '@/components/stats/WorkoutHistorySection'

export default function StatsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7days')

  // Memoized navigation handlers
  const handleStartExercise = useCallback(() => router.push('/workout'), [router])
  const handleLogWorkout = useCallback(() => router.push('/workout'), [router])
  const handleScheduleWorkout = useCallback(() => router.push('/calendar'), [router])
  const handleViewStats = useCallback(() => router.push('/stats'), [router])

  // Only run stats hook when user is loaded and user.id is valid
  const shouldRunStats = !!user && !!user.id && !userLoading;
  const { stats, loading: statsLoading, error } = useUserStats(shouldRunStats ? user.id : null, timeRange);

  // Combined loading state
  const loading = userLoading || statsLoading;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id) {
        setUser(user);
      }
      setUserLoading(false);
    };
    getUser();
  }, []);

  // Memoized time range change handler
  const handleTimeRangeChange = useCallback((newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange)
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout 
          onStartExercise={handleStartExercise}
          onLogWorkout={handleLogWorkout}
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

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout 
          onStartExercise={handleStartExercise}
          onLogWorkout={handleLogWorkout}
          onScheduleWorkout={handleScheduleWorkout}
          onViewStats={handleViewStats}
          exerciseInProgress={false}
          workoutCompleted={false}
        >
          <div className="container mx-auto px-4 py-8">
            <div className="brand-card text-center">
              <h2 className="text-subhead text-red-600 mb-4">Error Loading Stats</h2>
              <p className="text-body text-gray-600 mb-4">{error.message}</p>
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Reload Page
              </button>
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
        onScheduleWorkout={handleScheduleWorkout}
        onViewStats={handleViewStats}
        exerciseInProgress={false}
        workoutCompleted={false}
      >
        <div className="container mx-auto px-4 py-8">
          <main className="max-w-6xl mx-auto">
            {/* Page Header */}
            <StatsHeader />

            {/* Key Stats Grid */}
            <StatsGrid stats={stats} timeRange={timeRange} />

            {/* Streak Information */}
            <StreakInfoSection stats={stats} />

            {/* Time Range Selector */}
            <TimeRangeSelector 
              selectedRange={timeRange} 
              onRangeChange={handleTimeRangeChange} 
            />

            {/* Workout History */}
            <WorkoutHistorySection timeRange={timeRange} />
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
