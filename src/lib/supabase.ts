import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export const X3_EXERCISES = {
  Push: ['Chest Press', 'Tricep Press', 'Overhead Press', 'Front Squat'],
  Pull: ['Deadlift', 'Bent Row', 'Bicep Curl', 'Calf Raise']
}

export const BAND_COLORS = ['White', 'Light Gray', 'Dark Gray', 'Black']

// Calculate what workout should be today
export function getTodaysWorkout(startDate: string) {
  const start = new Date(startDate)
  // Use only the local date for today (ignores time and timezone)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  const week = Math.floor(daysSinceStart / 7) + 1
  const dayInWeek = daysSinceStart % 7
  
  // Week 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest
  // Week 5+: Push/Pull/Push/Pull/Push/Pull/Rest
  let schedule = week <= 4 
    ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
    : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest']
  
  return {
    week,
    workoutType: schedule[dayInWeek],
    dayInWeek
  }
}