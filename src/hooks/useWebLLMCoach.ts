'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X3_KNOWLEDGE_BASE, generateCoachingAdvice, COACHING_RESPONSES } from '@/lib/x3-knowledge-base'
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
  setInitProgressCallback?: (callback: (report: any) => void) => void
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
  userStats?: {
    totalWorkouts: number
    currentStreak: number
    longestStreak: number
    startDate: string
  }
  recentWorkouts?: any[]
  conversationHistory?: CoachMessage[]
}

const DEFAULT_MODEL = "Llama-3.1-8B-Instruct-q4f32_1-MLC"
const MAX_CONTEXT_MESSAGES = 10

export function useWebLLMCoach(options: WebLLMCoachOptions = {}) {
  const { userId, modelId = DEFAULT_MODEL, maxContextLength = 8192 } = options
  
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
      newEngine.setInitProgressCallback((report: any) => {
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

  // Load user workout context from Supabase
  const loadUserContext = useCallback(async (userId: string) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('x3_start_date')
        .eq('id', userId)
        .single()

      // Get recent workout data
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('workout_local_date_time', { ascending: false })
        .limit(50)

      if (exercises && profile) {
        const workoutDates = new Set(exercises.map(e => e.workout_local_date_time.split('T')[0]))
        const totalWorkouts = workoutDates.size
        
        // Calculate streaks
        const sortedDates = Array.from(workoutDates).sort()
        let currentStreak = 0
        let longestStreak = 0
        
        // Simple streak calculation (can be enhanced)
        if (sortedDates.length > 0) {
          currentStreak = 1
          longestStreak = 1
        }

        const context: UserWorkoutContext = {
          userStats: {
            totalWorkouts,
            currentStreak,
            longestStreak,
            startDate: profile.x3_start_date
          },
          recentWorkouts: exercises.slice(0, 10) // Keep recent 10 workouts
        }

        setUserContext(context)
        contextRef.current = context
        console.log('🧠 User context loaded:', context)
      }
    } catch (error) {
      console.error('🧠 Failed to load user context:', error)
    }
  }, [])

  // Build system prompt with X3 knowledge and user context
  const buildSystemPrompt = useCallback((context: UserWorkoutContext) => {
    const { userStats, workoutContext, currentExercise } = context
    
    let systemPrompt = `You are an expert X3 fitness coach with deep knowledge of the X3 Bar system and variable resistance training. You provide personalized coaching based on the user's current workout data and progress.

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

## X3 Exercise Knowledge:
${JSON.stringify(X3_KNOWLEDGE_BASE.exercises, null, 2)}

## X3 Program Structure:
- Weeks 1-4: Push/Pull/Rest/Push/Pull/Rest/Rest (adaptation phase)
- Weeks 5+: Push/Pull/Push/Pull/Push/Pull/Rest (intensification phase)

## Band Progression (Critical for advice):
- White Band: 10-35 lbs (Beginner) - Cannot go lighter than this
- Light Gray: 25-60 lbs (Beginner-Intermediate)  
- Gray: 50-120 lbs (Intermediate)
- Dark Gray: 70-150 lbs (Intermediate-Advanced)
- Black: 100-300+ lbs (Advanced)

## User's Current Context:
${userStats ? `
- Total Workouts: ${userStats.totalWorkouts}
- Current Streak: ${userStats.currentStreak} days
- Start Date: ${userStats.startDate}
` : ''}

${workoutContext ? `
- Current Workout: ${workoutContext.workoutType} (Week ${workoutContext.week})
- Progress: ${workoutContext.exercisesCompleted}/${workoutContext.totalExercises} exercises completed
` : ''}

${currentExercise ? `
- Current Exercise: ${currentExercise.name}
- Band: ${currentExercise.band}
- Last Performance: ${currentExercise.fullReps} full reps, ${currentExercise.partialReps} partial reps
` : ''}

## Your Role:
You are a motivational and knowledgeable X3 coach. Provide specific, actionable advice based on:
1. X3 methodology (15-40 reps to failure, band progression)
2. The user's current exercise and performance
3. Their progression level and workout history
4. X3 form principles and variable resistance concepts
5. Appropriate band selection and progression guidance

ALWAYS use X3-specific language:
- "Train to failure" not "complete your sets"
- "15-40 reps" not "8-12 reps" or "sets"
- "Move up/down a band" not "increase/decrease weight"
- "Variable resistance" not "weight training"

Keep responses conversational, encouraging, and focused exclusively on X3-specific coaching. Never suggest traditional weightlifting approaches.`

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
    if (userId && !isInitializing && !engine) {
      initializeEngine()
      loadUserContext(userId)
    }
  }, [userId, initializeEngine, loadUserContext, isInitializing, engine])

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
