// Coaching Service for AI-powered workout feedback
// Handles integration with coach-chat Edge Function and provides fallbacks

import { backendService } from './backend-integration'
import { supabase } from './supabase'

export interface CoachingRequest {
  user_id: string
  user_feedback: string
  workout_data?: any[]
  progress_history?: any[]
  coaching_type: 'static' | 'dynamic'
}

export interface CoachingResponse {
  message: string
  tts_message: string
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory'
  confidence: number
  suggestions?: string[]
  success: boolean
  error?: string
}

export class CoachingService {
  // Get coaching response with fallbacks
  async getCoachingResponse(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      // First try the backend service (Edge Function)
      const response = await backendService.getCoachingResponse(request)
      
      if (response.success) {
        return response
      }
      
      // Fallback to static coaching if dynamic fails
      if (request.coaching_type === 'dynamic') {
        console.log('Dynamic coaching failed, falling back to static')
        return await this.getStaticCoaching(request)
      }
      
      return response
      
    } catch (error) {
      console.error('Coaching service error:', error)
      
      // Final fallback response
      return {
        message: "I understand your feedback. Keep pushing through - every workout builds strength and mental toughness.",
        tts_message: "I understand your feedback. Keep pushing through - every workout builds strength and mental toughness.",
        tone: 'supportive',
        confidence: 0.6,
        suggestions: ["Focus on form over speed", "Rest adequately between sets", "Listen to your body"],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Static coaching fallback
  private async getStaticCoaching(request: CoachingRequest): Promise<CoachingResponse> {
    const { user_feedback, workout_data } = request
    
    // Simple rule-based coaching
    const feedback = user_feedback.toLowerCase()
    const totalReps = workout_data?.reduce((sum, exercise) => 
      sum + (exercise.full_reps || 0) + (exercise.partial_reps || 0), 0) || 0

    if (feedback.includes('tired') || feedback.includes('difficult')) {
      return {
        message: "I hear you - X3 is challenging! Remember, pushing through difficulty is what builds real strength. Take it one rep at a time.",
        tts_message: "I hear you - X3 is challenging! Remember, pushing through difficulty is what builds real strength.",
        tone: 'supportive',
        confidence: 0.8,
        suggestions: ["Focus on breathing", "Take extra rest if needed", "Remember your goals"],
        success: true
      }
    }

    if (feedback.includes('progress') || feedback.includes('improve')) {
      return {
        message: "Great to hear you're seeing progress! Consistency is key with X3. Keep tracking your reps and pushing to failure.",
        tts_message: "Great to hear you're seeing progress! Consistency is key with X3.",
        tone: 'motivational',
        confidence: 0.9,
        suggestions: ["Increase resistance when hitting 40+ reps", "Focus on form consistency", "Track your progress"],
        success: true
      }
    }

    if (totalReps >= 40) {
      return {
        message: "Outstanding work! 40+ reps means you're ready for the next resistance band. Your strength is growing!",
        tts_message: "Outstanding work! You're ready for the next resistance band.",
        tone: 'celebratory',
        confidence: 0.9,
        suggestions: ["Move to the next band color", "Maintain form with new resistance", "Track your progression"],
        success: true
      }
    }

    if (totalReps < 15) {
      return {
        message: "Every rep counts! Focus on quality over quantity. Perfect form with fewer reps beats sloppy form with more.",
        tts_message: "Every rep counts! Focus on quality over quantity.",
        tone: 'supportive',
        confidence: 0.7,
        suggestions: ["Focus on slow, controlled movements", "Ensure proper form", "Don't rush the process"],
        success: true
      }
    }

    // Default encouraging response
    return {
      message: "Keep up the great work! Your dedication to X3 training is building strength and mental toughness. Stay consistent!",
      tts_message: "Keep up the great work! Your dedication to X3 training is building strength.",
      tone: 'motivational',
      confidence: 0.8,
      suggestions: ["Stay consistent with your routine", "Push to failure on each set", "Rest 90 seconds between exercises"],
      success: true
    }
  }

  // Get user's coaching history
  async getCoachingHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('coaching_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get coaching history:', error)
      return []
    }
  }

  // Analyze workout data for coaching insights
  analyzeWorkoutData(workoutData: any[]): {
    totalReps: number
    averageReps: number
    exercisesCompleted: number
    potentialIssues: string[]
    recommendations: string[]
  } {
    if (!workoutData || workoutData.length === 0) {
      return {
        totalReps: 0,
        averageReps: 0,
        exercisesCompleted: 0,
        potentialIssues: [],
        recommendations: ["Start with basic exercises", "Focus on form", "Build consistency"]
      }
    }

    const totalReps = workoutData.reduce((sum, exercise) => 
      sum + (exercise.full_reps || 0) + (exercise.partial_reps || 0), 0)
    
    const averageReps = totalReps / workoutData.length
    const exercisesCompleted = workoutData.filter(ex => ex.completed).length
    
    const potentialIssues: string[] = []
    const recommendations: string[] = []

    // Analyze for potential issues
    if (averageReps < 10) {
      potentialIssues.push("Low rep count - may need lighter resistance")
      recommendations.push("Consider using a lighter band")
    }

    if (averageReps > 50) {
      potentialIssues.push("High rep count - may need heavier resistance")
      recommendations.push("Consider progressing to next band")
    }

    if (exercisesCompleted < workoutData.length * 0.8) {
      potentialIssues.push("Not completing all exercises")
      recommendations.push("Focus on completing your full routine")
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push("Maintain current resistance level", "Focus on form consistency", "Push to failure on each set")
    }

    return {
      totalReps,
      averageReps: Math.round(averageReps),
      exercisesCompleted,
      potentialIssues,
      recommendations
    }
  }

  // Generate personalized coaching prompt
  generateCoachingPrompt(
    userFeedback: string, 
    workoutData: any[], 
    progressHistory: any[]
  ): string {
    const analysis = this.analyzeWorkoutData(workoutData)
    
    return `User Feedback: "${userFeedback}"

Workout Analysis:
- Total Reps: ${analysis.totalReps}
- Average Reps: ${analysis.averageReps}
- Exercises Completed: ${analysis.exercisesCompleted}/${workoutData.length}
- Potential Issues: ${analysis.potentialIssues.join(', ') || 'None detected'}

Recent Progress: ${progressHistory.length} previous workouts

Please provide personalized X3 coaching feedback that addresses their specific situation and concerns.`
  }
}

// Singleton instance
export const coachingService = new CoachingService() 