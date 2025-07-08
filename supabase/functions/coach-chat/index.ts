import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoachChatRequest {
  user_id: string;
  user_feedback: string;
  workout_data?: any[];
  progress_history?: any[];
  coaching_type: 'static' | 'dynamic';
}

interface CoachChatResponse {
  message: string;
  tts_message: string;
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory';
  confidence: number;
  suggestions?: string[];
  error?: string;
  success: boolean;
}

// Static coaching messages for Momentum tier
const STATIC_COACHING_MESSAGES = {
  band_progression: [
    {
      message: "Outstanding! 40+ reps means you're ready for the next band!",
      tts: "Outstanding! You hit over 40 reps. Time to advance to the next resistance band!",
      tone: 'celebratory' as const,
      confidence: 0.9
    },
    {
      message: "Incredible strength gains! Time to advance to a heavier band.",
      tts: "Incredible progress! Your strength has grown - let's move to a heavier band.",
      tone: 'celebratory' as const,
      confidence: 0.9
    }
  ],
  improvement: [
    {
      message: "Great job! You improved from last time - keep building!",
      tts: "Great improvement from your last workout! Keep building that momentum.",
      tone: 'motivational' as const,
      confidence: 0.8
    },
    {
      message: "Nice progress! Your consistency is paying off.",
      tts: "Nice progress! Your consistency is paying off.",
      tone: 'motivational' as const,
      confidence: 0.8
    }
  ],
  encouragement: [
    {
      message: "Every rep counts! Consistency beats perfection.",
      tts: "Remember, every rep counts. Your consistency is what builds real strength.",
      tone: 'supportive' as const,
      confidence: 0.7
    },
    {
      message: "You're building mental toughness with every workout.",
      tts: "You're building mental toughness with every workout.",
      tone: 'supportive' as const,
      confidence: 0.7
    }
  ],
  plateau_warning: [
    {
      message: "Try focusing on slower, controlled reps to break through this plateau.",
      tts: "Consider slowing down your reps for better muscle tension and growth.",
      tone: 'educational' as const,
      confidence: 0.8,
      suggestions: ["Focus on 3-second eccentric phase", "Reduce band resistance temporarily", "Add extra rest between sets"]
    }
  ]
}

function getRandomMessage(type: keyof typeof STATIC_COACHING_MESSAGES): CoachChatResponse {
  const messages = STATIC_COACHING_MESSAGES[type]
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]
  
  return {
    message: randomMessage.message,
    tts_message: randomMessage.tts,
    tone: randomMessage.tone,
    confidence: randomMessage.confidence,
    suggestions: randomMessage.suggestions,
    success: true
  }
}

function analyzeWorkoutForStaticCoaching(workoutData: any[]): CoachChatResponse {
  if (!workoutData || workoutData.length === 0) {
    return getRandomMessage('encouragement')
  }

  const currentExercise = workoutData[0]
  const totalReps = (currentExercise.full_reps || 0) + (currentExercise.partial_reps || 0)
  
  // Rule-based analysis
  if (totalReps >= 40) {
    return getRandomMessage('band_progression')
  }
  
  if (totalReps < 15) {
    return getRandomMessage('encouragement')
  }
  
  // Check for improvement (would need progress history)
  return getRandomMessage('improvement')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { user_id, user_feedback, workout_data, progress_history, coaching_type }: CoachChatRequest = await req.json()

    if (!user_id || !coaching_type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: user_id and coaching_type' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check user subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User profile not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let response: CoachChatResponse

    // Route to appropriate coaching system based on tier and type
    if (coaching_type === 'static') {
      // Static intelligence coaching (Momentum tier)
      if (profile.subscription_tier === 'foundation') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Static coaching requires Momentum or Mastery subscription' 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      response = analyzeWorkoutForStaticCoaching(workout_data || [])
      
    } else if (coaching_type === 'dynamic') {
      // Dynamic AI coaching (Mastery tier only)
      if (profile.subscription_tier !== 'mastery') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Dynamic AI coaching requires Mastery subscription' 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // For now, return a mock dynamic response
      // In production, this would integrate with OpenAI/Claude APIs
      response = {
        message: `I understand your feedback: "${user_feedback}". Based on your workout data, I can see you're making progress. Keep focusing on form and pushing to failure.`,
        tts_message: `I understand your feedback. Based on your workout data, you're making progress. Keep focusing on form and pushing to failure.`,
        tone: 'supportive',
        confidence: 0.8,
        suggestions: ["Focus on controlled movements", "Rest 90 seconds between exercises", "Listen to your body"],
        success: true
      }
      
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid coaching_type. Must be "static" or "dynamic"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the coaching request for analytics
    await supabase
      .from('coaching_requests')
      .insert({
        user_id,
        coaching_type,
        user_feedback: user_feedback?.substring(0, 200), // Truncate for storage
        subscription_tier: profile.subscription_tier,
        response_tone: response.tone,
        confidence: response.confidence,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Coach chat error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 