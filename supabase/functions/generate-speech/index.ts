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
    console.log('🚀 Generate speech function started (OpenAI.fm with Ash voice)')
    
    // Log environment variables (without exposing keys)
    console.log('Environment check:', {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
      OPENAI_FM_API_KEY: Deno.env.get('OPENAI_FM_API_KEY') ? 'SET' : 'MISSING'
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const requestBody = await req.json()
    console.log('📥 Request received:', requestBody)
    
    const { text, voice = 'ash', speed = 1.0, user_id, context = 'general' }: GenerateSpeechRequest = requestBody

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

    // Get OpenAI.fm API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_FM_API_KEY')
    if (!openaiApiKey) {
      console.error('❌ OPENAI_FM_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI.fm API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ OPENAI_FM_API_KEY found, length:', openaiApiKey.length)

    console.log(`🎤 TTS Request - Voice: ash, Text: "${text.substring(0, 100)}..."`)

    // Generate speech using OpenAI.fm TTS API
    const openaiResponse = await fetch('https://api.openai.fm/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'ash',
        response_format: 'mp3'
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI.fm API error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TTS generation failed' 
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
        voice: 'ash',
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