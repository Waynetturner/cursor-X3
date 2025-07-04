
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

import { CORS_HEADERS } from './constants.ts'
import { ChatRequest, CoachResponse } from './types.ts'
import { buildPersonalizedContext, buildSimilarQueriesContext, buildMessages } from './context-builder.ts'
import { buildSystemPrompt } from './system-prompt-builder.ts'
import { needsWebSearch, callN8nPerplexity } from './n8n-perplexity.ts'
import { callOpenAI, callAnthropic } from './ai-providers.ts'
import { saveCoachResponse } from './database.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const requestBody = await req.json()
    console.log('📥 Received request body:', JSON.stringify(requestBody, null, 2))

    const { 
      message, 
      userId, 
      conversationHistory, 
      userDemographics, 
      isWorkoutAnalysis,
      similarQueries = [],
      enhancedResponse
    }: ChatRequest & { enhancedResponse?: any } = requestBody

    if (!message || !userId) {
      throw new Error('Message and userId are required')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    const n8nWebhookUrl = Deno.env.get('N8N_COACH_WEBHOOK_URL')
    
    console.log('🔧 Environment check:');
    console.log('  - OpenAI API Key:', openaiApiKey ? '✅ Present' : '❌ Missing');
    console.log('  - Anthropic API Key:', anthropicApiKey ? '✅ Present' : '❌ Missing');
    console.log('  - N8N Coach Webhook URL:', n8nWebhookUrl ? '✅ Present' : '❌ Missing');
    
    if (!openaiApiKey && !anthropicApiKey) {
      throw new Error('No AI API key configured')
    }

    console.log('Processing coach request for user:', userId)
    console.log('Message:', message)
    console.log('Is workout analysis:', isWorkoutAnalysis)
    console.log('Conversation history length:', conversationHistory?.length || 0)
    console.log('User demographics:', userDemographics)
    console.log('Similar queries found:', similarQueries?.length || 0)
    console.log('Enhanced response provided:', !!enhancedResponse)

    let coachResponse: string
    let sourceType = 'openai'
    let responseMetadata: any = {}

    // Check if we already have an enhanced response from n8n workflow
    if (enhancedResponse && enhancedResponse.model) {
      console.log('✅ Using enhanced response from n8n workflow')
      console.log('Enhanced response details:', {
        model: enhancedResponse.model,
        hasUsage: !!enhancedResponse.usage,
        hasCitations: !!enhancedResponse.citations,
        hasSearchResults: !!enhancedResponse.search_results
      })
      
      coachResponse = message // The message should contain the processed response from Perplexity
      sourceType = 'n8n_perplexity'
      responseMetadata = {
        model: enhancedResponse.model || 'perplexity-sonar',
        usage: enhancedResponse.usage || {},
        citations: enhancedResponse.citations || [],
        search_results: enhancedResponse.search_results || []
      }
    } else {
      // Try n8n webhook first if available
      if (n8nWebhookUrl) {
        console.log('🚀 Attempting n8n coach webhook...');
        try {
          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              userId: userId
            })
          });

          if (!n8nResponse.ok) {
            console.error('❌ n8n webhook failed with status:', n8nResponse.status);
            throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
          }

          const n8nData = await n8nResponse.json();
          console.log('✅ n8n response received successfully');
          console.log('Response preview:', n8nData.response?.substring(0, 200) + '...');
          
          if (!n8nData.response) {
            console.error('❌ No response in n8n data:', n8nData);
            throw new Error('No response in n8n data');
          }

          coachResponse = n8nData.response;
          sourceType = n8nData.sourceType || 'n8n_coach';
          responseMetadata = {
            model: 'n8n-workflow',
            hasContext: n8nData.hasContext || false,
            sourceType: n8nData.sourceType || 'n8n_coach'
          };
          console.log('✅ Successfully used n8n coach response');
        } catch (n8nError) {
          console.error('❌ n8n coach error:', n8nError);
          console.log('⬇️ Falling back to AI providers...');
          // Continue to fallback AI logic below
        }
      } else {
        console.log('⚠️ N8N_COACH_WEBHOOK_URL not configured - using AI providers')
      }

      // If we don't have a response yet from n8n, check if web search is needed
      if (!coachResponse) {
        const requiresWebSearch = needsWebSearch(message)
        console.log('🔍 Web search decision: NEEDS_WEB_SEARCH =', requiresWebSearch)

        // Try n8n Perplexity workflow if needed and available
        if (requiresWebSearch && n8nWebhookUrl) {
          console.log('🚀 Attempting n8n Perplexity workflow...');
          try {
            const personalizedContext = buildPersonalizedContext(userDemographics)
            const similarQueriesContext = buildSimilarQueriesContext(similarQueries)
            
            const n8nResult = await callN8nPerplexity(
              n8nWebhookUrl,
              message,
              userId,
              personalizedContext,
              similarQueriesContext,
              isWorkoutAnalysis
            )
            coachResponse = n8nResult.response
            sourceType = 'n8n_perplexity'
            responseMetadata = n8nResult.metadata
            console.log('✅ Successfully used n8n Perplexity response')
          } catch (n8nError) {
            console.error('❌ n8n Perplexity error:', n8nError)
            console.log('⬇️ Falling back to standard AI...')
            // Continue to fallback AI
          }
        } else if (requiresWebSearch && !n8nWebhookUrl) {
          console.log('⚠️ Web search needed but N8N_COACH_WEBHOOK_URL not configured - falling back to standard AI')
        } else {
          console.log('📝 Using standard AI (no web search needed)')
        }
      }

      // If we still don't have a response, use standard AI
      if (!coachResponse) {
        const personalizedContext = buildPersonalizedContext(userDemographics)
        const similarQueriesContext = buildSimilarQueriesContext(similarQueries)
        const systemPrompt = buildSystemPrompt(personalizedContext, similarQueriesContext, isWorkoutAnalysis)
        const messages = buildMessages(systemPrompt, conversationHistory || [], message)
        console.log('Calling AI API with messages:', messages.length)

        // Try OpenAI first, fallback to Anthropic if needed
        if (openaiApiKey) {
          try {
            const openaiResult = await callOpenAI(messages, isWorkoutAnalysis)
            coachResponse = openaiResult.response
            responseMetadata = openaiResult.metadata
          } catch (openaiError) {
            console.error('OpenAI API error:', openaiError)
            
            // Fallback to Anthropic if available
            if (anthropicApiKey) {
              console.log('Falling back to Anthropic...')
              const anthropicResult = await callAnthropic(messages, systemPrompt, isWorkoutAnalysis)
              coachResponse = anthropicResult.response
              sourceType = 'anthropic'
              responseMetadata = anthropicResult.metadata
            } else {
              throw openaiError
            }
          }
        } else {
          throw new Error('No AI API key available')
        }
      }
    }

    console.log('AI response received:', coachResponse.substring(0, 100) + '...')
    console.log('Final source type:', sourceType)

    // Save the coach conversation to database (both user message and coach response)
    await saveCoachResponse(userId, message, coachResponse, responseMetadata)

    const response: CoachResponse = { 
      response: coachResponse,
      sourceType,
      metadata: responseMetadata,
      similarQueriesUsed: similarQueries?.length || 0
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in coach-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    )
  }
})
