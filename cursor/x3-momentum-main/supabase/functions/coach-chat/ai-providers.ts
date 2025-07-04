
import { ResponseMetadata } from './types.ts';

export async function callOpenAI(messages: any[], isWorkoutAnalysis: boolean): Promise<{ response: string; metadata: ResponseMetadata }> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: isWorkoutAnalysis ? 800 : 500, // Increased from 500/300
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0].message.content,
    metadata: { model: 'gpt-4o', usage: data.usage }
  };
}

export async function callAnthropic(messages: any[], systemPrompt: string, isWorkoutAnalysis: boolean): Promise<{ response: string; metadata: ResponseMetadata }> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anthropicApiKey}`,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: isWorkoutAnalysis ? 800 : 500, // Increased from 500/300
      messages: messages.slice(1), // Remove system message for Anthropic
      system: systemPrompt
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    response: data.content[0].text,
    metadata: { model: 'claude-3-sonnet', usage: data.usage }
  };
}
