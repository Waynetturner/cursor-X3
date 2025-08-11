'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { generateCoachingAdvice, COACHING_RESPONSES } from '@/lib/x3-knowledge-base'
import { supabase } from '@/lib/supabase'

// Types for WebLLM
interface MLCEngine {
  reload: (modelId: string) => Promise<void>
  chat: {
    completions: {
      create: (options: {
        messages: Array<{ role: string; content: string }>
        temperature?: number
        max_tokens?: number
        stream?: boolean
      }) => Promise<{
        choices: Array<{
          message: {
            content: string
          }
        }>
      }>
    }
  }
  setInitProgressCallback?: (callback: (report: { text: string; progress: number }) => void) => void
}

interface WebLLMCoachOptions {
  userId?: string
  modelId?: string
  maxContextLength?: number
}

interface CoachMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface UserWorkoutContext {
  currentExercise?: {
    name: string
    band: string
    fullReps: number
    partialReps: number
    notes: string
  }
  workoutContext?: {
    workoutType: 'Push' | 'Pull' | 'Rest'
    week: number
    exercisesCompleted: number
    totalExercises: number
  }
  userProfile?: {
    name: string
    email: string
    startDate: string
    timezone?: string
    subscriptionTier?: string
    experienceLevel: string
    programWeek: number
    daysSinceStart: number
  }
  userStats?: {
    totalWorkouts: number
    currentStreak: number
    longestStreak: number
    startDate: string
    weeksSinceStart: number
    averageWorkoutsPerWeek: number
  }
  progressMetrics?: {
    topProgressions: Array<{
      exercise: string
      latestReps: number
      oldestReps: number
      improvement: number
      sessions: number
    }>
    totalExercisesSessions: number
    uniqueExercisesTried: number
    mostImprovedExercise?: string
    averageSessionLength: number
  }
  userGoals?: Array<{
    type: string
    target: Record<string, unknown>
    current: Record<string, unknown>
    description: string
    deadline: string
  }>
  measurements?: Array<{
    type: string
    value: number
    unit: string
    date: string
  }>
  recentWorkouts?: Array<{
    exercise: string
    band: string
    fullReps: number
    partialReps: number
    date: string
    workoutType: string
    week: number
    notes?: string
  }>
  preferences?: {
    ttsEnabled: boolean
    ttsVoice: string
    preferredWorkoutTime?: string
    reminderSettings?: {
      enabled?: boolean;
      frequency?: number;
      [key: string]: unknown;
    }
    coachingStyle: string
  }
  conversationHistory?: CoachMessage[]
}

const DEFAULT_MODEL = "Llama-3.1-8B-Instruct-q4f32_1-MLC"
const MAX_CONTEXT_MESSAGES = 10

export function useWebLLMCoach(options: WebLLMCoachOptions = {}) {
  const { userId, modelId = DEFAULT_MODEL } = options
  // Removed unused maxContextLength
  
  // State management
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<CoachMessage[]>([])
  
  // Context management
  const [userContext, setUserContext] = useState<UserWorkoutContext>({})
  const contextRef = useRef<UserWorkoutContext>({})

  // Initialize WebLLM engine
  const initializeEngine = useCallback(async () => {
    if (isInitializing || engine) return
    
    setIsInitializing(true)
    setError(null)

    try {
      // Dynamic import to avoid SSR issues
      const { MLCEngine } = await import('@mlc-ai/web-llm')
      
      console.log('🧠 Initializing WebLLM with model:', modelId)
      const newEngine = new MLCEngine()
      
      // Configure engine initialization callback
      newEngine.setInitProgressCallback((report: { text: string; progress: number }) => {
        console.log('🧠 WebLLM Loading:', report.text)
      })
      
      await newEngine.reload(modelId)
      
      setEngine(newEngine)
      setIsReady(true)
      console.log('🧠 WebLLM initialized successfully!')
      
    } catch (error) {
      console.error('🧠 WebLLM initialization failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to initialize WebLLM')
    } finally {
      setIsInitializing(false)
    }
  }, [modelId, isInitializing, engine])

  // Load comprehensive user context from Supabase
  const loadUserContext = useCallback(async (userId: string) => {
    try {
      console.log('🧠 Loading comprehensive user context for:', userId)

      if (!userId) {
        console.error('🧠 Cannot load context: userId is null/undefined')
        return
      }

      // Get user profile with all available data - use defensive query
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*') // Select all columns to see what's actually available
        .eq('id', userId)
        .single()

      console.log('🧠 Profile query result:', { profile, profileError })

      if (profileError) {
        console.error('🧠 Profile query error:', profileError)
        // Try a simpler query as fallback
        const { data: simpleProfile, error: simpleError } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .eq('id', userId)
          .single()
        
        console.log('🧠 Simple profile fallback:', { simpleProfile, simpleError })
        
        if (simpleProfile && !simpleError) {
          // Use the simple profile as base and continue with basic context
          console.log('🧠 Using simple profile for basic context')
          profile = simpleProfile
        }
      }

      // If we still don't have a profile, try getting user from auth
      if (!profile) {
        console.log('🧠 No profile found, trying auth user')
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser && authUser.id === userId) {
          console.log('🧠 Using auth user as fallback profile')
          profile = {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            display_name: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name,
            full_name: authUser.user_metadata?.full_name,
            x3_start_date: authUser.user_metadata?.x3_start_date
          }
        }
      }

      // Get user goals and targets
      const { data: goals } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Get user measurements/body composition
      const { data: measurements } = await supabase
        .from('user_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('measurement_date', { ascending: false })
        .limit(10)

      // Get complete workout history (last 100 exercises for analysis)
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          exercise_name,
          band_color,
          full_reps,
          partial_reps,
          notes,
          workout_local_date_time,
          workout_type,
          week_number
        `)
        .eq('user_id', userId)
        .order('workout_local_date_time', { ascending: false })
        .limit(100)

      // Get user UI settings and preferences
      const { data: uiSettings } = await supabase
        .from('user_ui_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        // Analyze workout patterns
        const workoutDates = new Set(exercises?.map(e => e.workout_local_date_time.split('T')[0]) || [])
        const totalWorkouts = workoutDates.size
        
        // Calculate detailed progress metrics
        const exerciseGroups = exercises?.reduce((acc, ex) => {
          const key = `${ex.exercise_name}-${ex.band_color}`
          if (!acc[key]) acc[key] = []
          acc[key].push({
            fullReps: ex.full_reps,
            partialReps: ex.partial_reps,
            date: ex.workout_local_date_time,
            week: ex.week_number
          })
          return acc
        }, {} as Record<string, Record<string, unknown>[]>) || {}

        // Find strongest progressions
        const progressions = Object.entries(exerciseGroups).map(([exercise, performances]) => {
          const sorted = performances.sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())
          const latest = sorted[0]
          const oldest = sorted[sorted.length - 1]
          return {
            exercise,
            latestReps: Number(latest?.fullReps || 0) + Number(latest?.partialReps || 0),
            oldestReps: Number(oldest?.fullReps || 0) + Number(oldest?.partialReps || 0),
            improvement: (Number(latest?.fullReps || 0) + Number(latest?.partialReps || 0)) - (Number(oldest?.fullReps || 0) + Number(oldest?.partialReps || 0)),
            sessions: performances.length
          }
        }).filter(p => p.improvement > 0).sort((a, b) => b.improvement - a.improvement)

        // Calculate current program week based on start date
        const startDate = new Date(profile.x3_start_date || profile.created_at)
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const programWeek = Math.floor(daysSinceStart / 7) + 1

        // Calculate streaks (more sophisticated)
        const sortedDates = Array.from(workoutDates).sort()
        let currentStreak = 0
        let longestStreak = 0
        
        if (sortedDates.length > 0) {
          // Calculate current streak
          const checkDate = new Date()
          while (checkDate >= new Date(sortedDates[0])) {
            const dateStr = checkDate.toISOString().split('T')[0]
            if (workoutDates.has(dateStr)) {
              currentStreak++
            } else if (currentStreak > 0) {
              break
            }
            checkDate.setDate(checkDate.getDate() - 1)
          }

          // Calculate longest streak (simplified)
          longestStreak = Math.max(currentStreak, Math.floor(sortedDates.length / 2))
        }

        // Determine user level and experience
        const weeksSinceStart = Math.floor(daysSinceStart / 7)
        let experienceLevel = 'Beginner'
        if (weeksSinceStart >= 12) experienceLevel = 'Intermediate'
        if (weeksSinceStart >= 24) experienceLevel = 'Advanced'
        if (weeksSinceStart >= 52) experienceLevel = 'Expert'

        const context: UserWorkoutContext = {
          // Personal information
          userProfile: {
            name: profile.display_name || profile.full_name || 'X3 Warrior',
            email: profile.email,
            startDate: profile.x3_start_date || profile.created_at,
            timezone: profile.timezone,
            subscriptionTier: profile.subscription_tier,
            experienceLevel,
            programWeek,
            daysSinceStart
          },

          // Workout statistics
          userStats: {
            totalWorkouts,
            currentStreak,
            longestStreak,
            startDate: profile.x3_start_date || profile.created_at,
            weeksSinceStart,
            averageWorkoutsPerWeek: totalWorkouts / Math.max(weeksSinceStart, 1)
          },

          // Progress and achievements
          progressMetrics: {
            topProgressions: progressions.slice(0, 5),
            totalExercisesSessions: exercises?.length || 0,
            uniqueExercisesTried: Object.keys(exerciseGroups).length,
            mostImprovedExercise: progressions[0]?.exercise,
            averageSessionLength: exercises?.length ? Math.round(exercises.length / totalWorkouts) : 0
          },

          // Goals and targets
          userGoals: goals?.map(g => ({
            type: g.goal_type,
            target: g.target_value,
            current: g.current_value,
            description: g.description,
            deadline: g.target_date
          })) || [],

          // Physical measurements
          measurements: measurements?.slice(0, 3).map(m => ({
            type: m.measurement_type,
            value: m.value,
            unit: m.unit,
            date: m.measurement_date
          })) || [],

          // Recent workout performance
          recentWorkouts: exercises?.slice(0, 15).map(e => ({
            exercise: e.exercise_name,
            band: e.band_color,
            fullReps: e.full_reps,
            partialReps: e.partial_reps,
            date: e.workout_local_date_time,
            workoutType: e.workout_type,
            week: e.week_number,
            notes: e.notes
          })) || [],

          // User preferences
          preferences: {
            ttsEnabled: uiSettings?.tts_enabled || false,
            ttsVoice: uiSettings?.tts_voice || 'alloy',
            preferredWorkoutTime: uiSettings?.preferred_workout_time,
            reminderSettings: uiSettings?.reminder_settings,
            coachingStyle: uiSettings?.coaching_style || 'motivational'
          }
        }

        setUserContext(context)
        contextRef.current = context
        console.log('🧠 Comprehensive user context loaded:', {
          name: context.userProfile?.name,
          totalWorkouts: context.userStats?.totalWorkouts,
          experienceLevel: context.userProfile?.experienceLevel,
          goals: context.userGoals?.length,
          progressions: context.progressMetrics?.topProgressions?.length
        })
      }
    } catch (error) {
      console.error('🧠 Failed to load user context:', error)
    }
  }, [])

  // Build system prompt with X3 knowledge and comprehensive user context
  const buildSystemPrompt = useCallback((context: UserWorkoutContext) => {
    const { userProfile, userStats, workoutContext, currentExercise, progressMetrics, userGoals, measurements, recentWorkouts, preferences } = context
    
    const systemPrompt = `You are an expert X3 fitness coach with deep knowledge of the X3 Bar system and variable resistance training. You provide personalized coaching based on the user's comprehensive profile and progress data.

## CRITICAL X3 METHODOLOGY - NEVER SUGGEST TRADITIONAL WEIGHTLIFTING ADVICE:

### X3 Rep Range and Progression (MOST IMPORTANT):
- TARGET: 15-40 repetitions per exercise (NOT sets - just one continuous effort to failure)
- If user cannot complete 15 full range reps: Move down to lighter band (except White band - stay on White and build strength)
- If user completes more than 40 full range reps: Move up to heavier band
- After reaching failure in full range of motion, continue with partial range repetitions until complete muscular failure
- NO SETS, NO REST PERIODS - Each exercise is performed once to complete failure

### What X3 is NOT:
- NOT traditional sets and reps (like "4 sets of 10 reps") - NEVER suggest this
- NOT multiple sets with rest periods
- NOT rep targets like 8-12 reps
- NOT traditional gym programming

## Core X3 Principles:
- Variable resistance provides 7x more muscle activation than traditional weights
- Train to failure, not to a number - focus on quality over quantity
- 4-second positive and 4-second negative repetitions for optimal time under tension
- Progressive overload through band progression (changing band resistance)

## Band Progression (Critical for advice):
- White Band: 10-35 lbs (Beginner) - Cannot go lighter than this
- Light Gray: 25-60 lbs (Beginner-Intermediate)  
- Gray: 50-120 lbs (Intermediate)
- Dark Gray: 70-150 lbs (Intermediate-Advanced)
- Black: 100-300+ lbs (Advanced)

## X3 Program Structure:
- Weeks 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest (adaptation phase)
- Weeks 5+: Push/Pull/Push/Pull/Push/Pull/Rest (intensification phase)

## USER PROFILE & CONTEXT:
${userProfile ? `
**Personal Information:**
- Name: ${userProfile.name}
- Experience Level: ${userProfile.experienceLevel}
- Program Week: ${userProfile.programWeek}
- Days Since Starting X3: ${userProfile.daysSinceStart}
- X3 Start Date: ${userProfile.startDate}
- Subscription: ${userProfile.subscriptionTier || 'Standard'}
` : ''}

${userStats ? `
**Workout Statistics:**
- Total Workouts Completed: ${userStats.totalWorkouts}
- Current Streak: ${userStats.currentStreak} days
- Longest Streak: ${userStats.longestStreak} days
- Average Workouts/Week: ${userStats.averageWorkoutsPerWeek.toFixed(1)}
- Weeks in Program: ${userStats.weeksSinceStart}
` : ''}

${progressMetrics ? `
**Progress & Achievements:**
- Total Exercise Sessions: ${progressMetrics.totalExercisesSessions}
- Unique Exercises Tried: ${progressMetrics.uniqueExercisesTried}
- Most Improved Exercise: ${progressMetrics.mostImprovedExercise || 'N/A'}
- Average Session Length: ${progressMetrics.averageSessionLength} exercises
${progressMetrics.topProgressions?.length > 0 ? `
- Top Progressions:
${progressMetrics.topProgressions.map(p => `  • ${p.exercise}: +${p.improvement} total reps (${p.sessions} sessions)`).join('\n')}` : ''}
` : ''}

${userGoals && userGoals.length > 0 ? `
**User Goals:**
${userGoals.map(g => `- ${g.type}: ${g.description} (Target: ${g.target}, Current: ${g.current})`).join('\n')}
` : ''}

${measurements && measurements.length > 0 ? `
**Recent Measurements:**
${measurements.map(m => `- ${m.type}: ${m.value} ${m.unit} (${new Date(m.date).toLocaleDateString()})`).join('\n')}
` : ''}

${workoutContext ? `
**Current Workout Session:**
- Workout Type: ${workoutContext.workoutType} (Week ${workoutContext.week})
- Progress: ${workoutContext.exercisesCompleted}/${workoutContext.totalExercises} exercises completed
` : ''}

${currentExercise ? `
**Current Exercise:**
- Exercise: ${currentExercise.name}
- Band: ${currentExercise.band}
- Last Performance: ${currentExercise.fullReps} full reps, ${currentExercise.partialReps} partial reps
${currentExercise.notes ? `- Notes: ${currentExercise.notes}` : ''}
` : ''}

${recentWorkouts && recentWorkouts.length > 0 ? `
**Recent Workout History (Last 5 sessions):**
${recentWorkouts.slice(0, 5).map(w => `- ${w.exercise} (${w.band} band): ${w.fullReps}+${w.partialReps} reps - Week ${w.week} ${w.workoutType}`).join('\n')}
` : ''}

${preferences ? `
**User Preferences:**
- Coaching Style: ${preferences.coachingStyle}
- TTS Voice: ${preferences.ttsVoice}
- Voice Enabled: ${preferences.ttsEnabled ? 'Yes' : 'No'}
` : ''}

## YOUR ROLE AS X3 AI COACH:
You are ${userProfile?.name || 'this user'}'s personal X3 coach. Use their specific data to provide:

1. **Personalized Progression Advice**: Based on their ${userProfile?.experienceLevel || 'current'} level and ${userStats?.totalWorkouts || 0} completed workouts
2. **Context-Aware Form Coaching**: Reference their recent performance and specific exercises
3. **Motivational Support**: Acknowledge their ${userStats?.currentStreak || 0}-day streak and progress
4. **Goal-Oriented Guidance**: Help them work toward their specific fitness goals
5. **X3-Specific Methodology**: Always follow 15-40 rep ranges, band progression, and train-to-failure principles

ALWAYS use X3-specific language and reference their personal data:
- "Based on your ${userStats?.totalWorkouts || 0} workouts so far..."
- "Since you're in week ${userProfile?.programWeek || 1} of the program..."
- "Your ${progressMetrics?.mostImprovedExercise || 'recent progress'} shows great improvement..."
- "Train to failure between 15-40 reps" not "complete your sets"
- "Move up/down a band" not "increase/decrease weight"

Keep responses conversational, encouraging, and highly personalized to ${userProfile?.name || 'the user'}. Never suggest traditional weightlifting approaches.`

    return systemPrompt
  }, [])

  // Generate coaching response
  const generateResponse = useCallback(async (userMessage: string, context: UserWorkoutContext = {}) => {
    if (!engine || !isReady) {
      throw new Error('WebLLM engine not ready')
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Merge current context with provided context
      const fullContext = { ...userContext, ...context }
      
      // Build system prompt
      const systemPrompt = buildSystemPrompt(fullContext)
      
      // Prepare conversation history with system prompt
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-MAX_CONTEXT_MESSAGES), // Keep recent conversation
        { role: 'user' as const, content: userMessage }
      ]

      console.log('🧠 Generating response with context:', {
        messagesCount: messages.length,
        userMessage,
        context: fullContext
      })

      // Generate response using WebLLM
      const response = await engine.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 512,
        stream: false
      })

      const assistantMessage = response.choices[0]?.message?.content || "I'm here to help with your X3 training!"

      // Update conversation history
      const newHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage },
        { role: 'assistant' as const, content: assistantMessage }
      ].slice(-MAX_CONTEXT_MESSAGES * 2) // Keep conversation manageable

      setConversationHistory(newHistory)

      console.log('🧠 Generated response:', assistantMessage)
      return assistantMessage

    } catch (error) {
      console.error('🧠 Response generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate response'
      setError(errorMessage)
      
      // Fallback to knowledge base response
      const fallbackAdvice = generateCoachingAdvice({
        currentExercise: context.currentExercise?.name,
        week: context.workoutContext?.week,
        workoutType: context.workoutContext?.workoutType,
        bandColor: context.currentExercise?.band,
        userQuestion: userMessage
      })
      
      return fallbackAdvice.general || COACHING_RESPONSES.motivation[0]
      
    } finally {
      setIsGenerating(false)
    }
  }, [engine, isReady, userContext, conversationHistory, buildSystemPrompt])

  // Update context for current workout
  const updateWorkoutContext = useCallback((context: Partial<UserWorkoutContext>) => {
    const newContext = { ...userContext, ...context }
    setUserContext(newContext)
    contextRef.current = newContext
  }, [userContext])

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setConversationHistory([])
  }, [])

  // Auto-initialize when userId is provided
  useEffect(() => {
    console.log('🧠 WebLLM useEffect triggered:', { userId, isInitializing, hasEngine: !!engine })
    if (userId && !isInitializing && !engine) {
      console.log('🧠 Starting WebLLM initialization for user:', userId)
      initializeEngine()
      loadUserContext(userId)
    } else if (userId && engine && Object.keys(userContext).length === 0) {
      // If engine exists but no user context, load it
      console.log('🧠 Engine ready, loading user context for:', userId)
      loadUserContext(userId)
    }
  }, [userId, initializeEngine, loadUserContext, isInitializing, engine])

  // Separate effect to load user context when user becomes available
  useEffect(() => {
    if (userId && !userContext.userProfile) {
      console.log('🧠 Loading user context separately for:', userId)
      loadUserContext(userId)
    }
  }, [userId, userContext.userProfile, loadUserContext])

  return {
    // State
    isInitializing,
    isReady,
    isGenerating,
    error,
    conversationHistory,
    userContext,
    
    // Actions
    initializeEngine,
    generateResponse,
    updateWorkoutContext,
    loadUserContext,
    clearHistory,
    
    // Status checks
    canGenerate: isReady && !isGenerating
  }
}
