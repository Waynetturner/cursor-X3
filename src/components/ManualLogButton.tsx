'use client'

import React, { useState } from 'react'
import { CheckCircle, RefreshCw, Bug } from 'lucide-react'
import { updateDailyWorkoutLog, getUserToday } from '@/lib/daily-workout-log'
import { supabase } from '@/lib/supabase'

interface ManualLogButtonProps {
  user: { id: string } | null
  onLogUpdated?: () => void
}

export default function ManualLogButton({ user, onLogUpdated }: ManualLogButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  // Convert UTC workout time to user's local date
  const convertWorkoutToLocalDate = async (workoutUtcTime: string, userId: string): Promise<string> => {
    // Get user's timezone from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .single()

    const userTimezone = profile?.timezone || 'America/New_York' // fallback
    
    // Convert UTC time to user's local date
    const utcDate = new Date(workoutUtcTime)
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezone }))
    
    // Return in YYYY-MM-DD format
    return localDate.toISOString().split('T')[0]
  }

  const updateTodaysLog = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setMessage('')
    setDebugInfo('')

    try {
      // Get user's timezone-aware "today"
      const today = await getUserToday(user.id)
      console.log('🗓️ User timezone today:', today)
      setDebugInfo(`Today: ${today}`)
      
      // Get user's timezone for conversion
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()

      const userTimezone = profile?.timezone || 'America/New_York'
      console.log('🌍 User timezone:', userTimezone)
      
      // Query workout_exercises using the correct column name: workout_local_date_time
      // But remember this is actually UTC time, despite the name
      const { data: allExercises, error: exerciseError } = await supabase
        .from('workout_exercises')
        .select('exercise_name, workout_type, workout_local_date_time, full_reps, partial_reps')
        .eq('user_id', user.id)
        .order('workout_local_date_time', { ascending: false })
        .limit(50) // Get recent exercises to check

      console.log('📊 All recent exercises:', allExercises)
      
      if (exerciseError) {
        setMessage(`Database error: ${exerciseError.message}`)
        setIsLoading(false)
        return
      }

      if (!allExercises || allExercises.length === 0) {
        setMessage('No exercises found')
        setIsLoading(false)
        return
      }

      // Convert UTC workout times to user's local dates and filter for today
      const todaysExercises = []
      for (const exercise of allExercises) {
        const localDate = await convertWorkoutToLocalDate(exercise.workout_local_date_time, user.id)
        console.log(`🔄 Exercise on ${exercise.workout_local_date_time} (UTC) = ${localDate} (local)`)
        
        if (localDate === today) {
          todaysExercises.push(exercise)
        }
      }

      console.log('✅ Today\'s exercises (timezone-corrected):', todaysExercises)
      setDebugInfo(`Found ${todaysExercises.length} exercises for ${today} (timezone: ${userTimezone})`)

      if (todaysExercises.length === 0) {
        setMessage('No exercises found for today (timezone-corrected)')
        setIsLoading(false)
        return
      }

      // Get workout type from the first exercise
      const workoutType = todaysExercises[0].workout_type as 'Push' | 'Pull'
      
      if (!workoutType) {
        setMessage('No workout type found in exercises')
        setIsLoading(false)
        return
      }

      console.log('🎯 Workout type:', workoutType)

      // Check if entry already exists in daily_workout_log
      const { data: existingEntry } = await supabase
        .from('daily_workout_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)  // This uses the string date format
        .single()

      if (existingEntry) {
        setMessage(`Entry already exists: ${existingEntry.workout_type} - ${existingEntry.status}`)
        setIsLoading(false)
        return
      }

      // Update the daily workout log
      console.log('📝 Updating daily workout log...', { userId: user.id, date: today, workoutType })
      
      await updateDailyWorkoutLog(user.id, today, workoutType)
      
      setMessage(`✅ Added: ${workoutType} workout for ${today}`)
      setDebugInfo(`Success! Converted ${todaysExercises.length} UTC exercises to local date ${today}`)
      
      // Refresh calendar
      if (onLogUpdated) {
        setTimeout(onLogUpdated, 500)
      }
      
    } catch (error) {
      console.error('❌ Error:', error)
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="text-center space-y-2">
      <button
        onClick={updateTodaysLog}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Updating...' : 'Mark Today Complete'}</span>
      </button>
      
      {message && (
        <div className={`text-sm px-3 py-1 rounded max-w-md ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
      
      {debugInfo && (
        <div className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded max-w-md">
          <Bug className="inline w-3 h-3 mr-1" />
          {debugInfo}
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Updates daily log with timezone-aware date conversion
      </p>
    </div>
  )
}