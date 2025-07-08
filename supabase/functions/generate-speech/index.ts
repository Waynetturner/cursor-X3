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
    const { text, voice = 'en-US-Neural2-F', speed = 1.0, user_id }: GenerateSpeechRequest = await req.json()

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

    // Check if user has access to TTS (Momentum and Mastery tiers)
    if (profile.subscription_tier === 'foundation') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TTS feature requires Momentum or Mastery subscription' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For now, return a mock response since we're not integrating with a real TTS service
    // In production, this would integrate with Google Cloud TTS, Amazon Polly, or similar
    const mockAudioUrl = `https://api.example.com/tts?text=${encodeURIComponent(text)}&voice=${voice}&speed=${speed}`

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
      audio_url: mockAudioUrl,
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