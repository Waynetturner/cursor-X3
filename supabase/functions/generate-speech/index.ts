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
    console.log('🚀 Generate speech function started')
    
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

    // Validate voice parameter - OpenAI.fm supports premium voices including 'ash'
    const validVoices = ['ash', 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    const selectedVoice = validVoices.includes(voice) ? voice : 'ash'
    
    if (voice !== selectedVoice) {
      console.log(`⚠️ Voice '${voice}' not supported, using '${selectedVoice}' instead`)
    }

    // Get context-aware instructions for dynamic voice directions
    function getInstructionsForContext(context: string): string {
      switch (context) {
        case 'exercise':
          return 'Voice Affect: Energetic and motivational. Tone: Encouraging and powerful. Pacing: Steady with emphasis on key words. Emotion: Confident and inspiring.'
        case 'countdown':
          return 'Voice Affect: Building intensity. Tone: Focused and urgent. Pacing: Deliberate with dramatic emphasis. Emotion: Anticipation and readiness.'
        case 'rest':
          return 'Voice Affect: Calm but encouraging. Tone: Supportive and reassuring. Pacing: Relaxed with gentle emphasis. Emotion: Recovery-focused.'
        case 'coach':
          return 'Voice Affect: Professional and knowledgeable. Tone: Supportive mentor. Pacing: Clear and thoughtful. Emotion: Encouraging and wise.'
        default:
          return 'Voice Affect: Natural and friendly. Tone: Clear and professional. Pacing: Conversational. Emotion: Helpful and supportive.'
      }
    }

    const instructions = getInstructionsForContext(context)
    console.log(`🎤 TTS Request - Context: ${context}, Voice: ${selectedVoice}, Speed: ${speed}, Instructions: ${instructions}`)
    console.log(`📝 Text: "${text.substring(0, 100)}..."`)

    // Generate speech using OpenAI.fm TTS API with dynamic instructions
    const requestBody = {
      model: 'tts-1-hd', // Use high-definition TTS model
      input: text,
      voice: selectedVoice, // Including premium 'ash' voice
      speed: speed,
      instructions: instructions, // Dynamic voice directions based on context
      response_format: 'mp3'
    }

    console.log('📤 OpenAI.fm TTS Request Body:', JSON.stringify(requestBody, null, 2))

    // Test different potential OpenAI.fm endpoints
    const possibleEndpoints = [
      'https://openai.fm/v1/audio/speech',
      'https://api.openai.fm/v1/audio/speech', 
      'https://openai.fm/api/v1/audio/speech'
    ]

    let openaiResponse = null
    let lastError = null
    let workingEndpoint = null

    // Try each endpoint until one works
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`)
        
        openaiResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log(`📡 Response from ${endpoint}:`, {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          headers: Object.fromEntries(openaiResponse.headers.entries())
        })

        if (openaiResponse.ok) {
          workingEndpoint = endpoint
          console.log(`✅ Success with endpoint: ${endpoint}`)
          break
        } else {
          const errorText = await openaiResponse.text()
          console.log(`❌ Failed with ${endpoint}:`, errorText)
          lastError = errorText
        }
      } catch (error) {
        console.log(`💥 Network error with ${endpoint}:`, error.message)
        lastError = error.message
      }
    }

    // Check if any endpoint worked
    if (!openaiResponse || !openaiResponse.ok) {
      console.error('❌ All OpenAI.fm endpoints failed')
      console.error('Last error:', lastError)
      
      // Try fallback to standard OpenAI API as last resort
      console.log('🔄 Trying fallback to standard OpenAI API')
      try {
        const fallbackBody = {
          model: 'tts-1-hd',
          input: text,
          voice: selectedVoice === 'ash' ? 'alloy' : selectedVoice, // Map ash to alloy for standard API
          speed: speed,
          response_format: 'mp3'
          // Note: No instructions parameter for standard API
        }

        const fallbackResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`, // Try same key first
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fallbackBody),
        })

        if (fallbackResponse.ok) {
          console.log('✅ Fallback to standard OpenAI succeeded')
          openaiResponse = fallbackResponse
          workingEndpoint = 'https://api.openai.com/v1/audio/speech (fallback)'
        } else {
          const fallbackError = await fallbackResponse.text()
          console.log('❌ Fallback also failed:', fallbackError)
        }
      } catch (fallbackError) {
        console.log('💥 Fallback network error:', fallbackError.message)
      }
    }

    // Final error check
    if (!openaiResponse || !openaiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `All TTS endpoints failed. Last error: ${lastError}. Check logs for details.` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🎉 Using working endpoint: ${workingEndpoint}`)

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