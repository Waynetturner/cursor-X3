import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateSpeechRequest {
  text: string;
  voice?: string;
  speed?: number;
  user_id: string;
  context?: 'exercise' | 'countdown' | 'rest' | 'general';
}

interface GenerateSpeechResponse {
  audio_url?: string;
  error?: string;
  success: boolean;
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
    const { text, voice = 'ash', speed = 1.0, user_id, context = 'general' }: GenerateSpeechRequest = await req.json()

    if (!text || !user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: text and user_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check user subscription tier for TTS feature access
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

    // Allow TTS for all tiers now (better voice quality improvement)
    console.log(`TTS request for ${profile.subscription_tier} tier user`)

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get context-aware instructions for TTS
    function getInstructionsForContext(context: string): string {
      switch (context) {
        case 'exercise':
          return 'Voice Affect: Energetic and motivational. Tone: Encouraging and powerful. Pacing: Steady with emphasis on key words. Emotion: Confident and inspiring.'
        case 'countdown':
          return 'Voice Affect: Building intensity. Tone: Focused and urgent. Pacing: Deliberate with dramatic emphasis. Emotion: Anticipation and readiness.'
        case 'rest':
          return 'Voice Affect: Calm but encouraging. Tone: Supportive and reassuring. Pacing: Relaxed with gentle emphasis. Emotion: Recovery-focused.'
        default:
          return 'Voice Affect: Natural and friendly. Tone: Clear and professional. Pacing: Conversational. Emotion: Helpful and supportive.'
      }
    }

    const instructions = getInstructionsForContext(context)
    console.log(`🎤 TTS Context: ${context}, Instructions: ${instructions}`)

    // Generate speech using OpenAI TTS API with 'ash' voice and dynamic instructions
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        input: text,
        voice: 'ash', // High quality ash voice with dynamic capabilities
        speed: speed,
        instructions: instructions,
      }),
    })

    if (!openaiResponse.ok) {
      console.error('OpenAI TTS API error:', openaiResponse.status, openaiResponse.statusText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `OpenAI TTS failed: ${openaiResponse.statusText}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the audio data and convert to base64 data URL
    const audioBuffer = await openaiResponse.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`

    // Log the TTS request for analytics
    await supabase
      .from('tts_requests')
      .insert({
        user_id,
        text: text.substring(0, 100), // Truncate for storage
        voice,
        speed,
        subscription_tier: profile.subscription_tier,
        created_at: new Date().toISOString()
      })

    const response: GenerateSpeechResponse = {
      audio_url: audioUrl,
      success: true
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Generate speech error:', error)
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