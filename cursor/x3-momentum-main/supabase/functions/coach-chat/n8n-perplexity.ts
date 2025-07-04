
import { N8nResponse, ResponseMetadata } from './types.ts';

export async function callN8nPerplexity(
  n8nWebhookUrl: string,
  message: string,
  userId: string,
  personalizedContext: string,
  similarQueriesContext: string,
  isWorkoutAnalysis: boolean
): Promise<{ response: string; metadata: ResponseMetadata }> {
  console.log('🔍 Calling n8n Perplexity workflow...');
  console.log('Webhook URL:', n8nWebhookUrl.substring(0, 50) + '...');
  console.log('Message for Perplexity:', message);
  
  const n8nResponse = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      userId: userId,
      personalizedContext: personalizedContext,
      similarQueriesContext: similarQueriesContext,
      isWorkoutAnalysis: isWorkoutAnalysis
    })
  });

  if (!n8nResponse.ok) {
    console.error('❌ n8n webhook failed with status:', n8nResponse.status);
    throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
  }

  const n8nData: N8nResponse = await n8nResponse.json();
  console.log('✅ n8n response received successfully');
  console.log('Response preview:', n8nData.message?.substring(0, 200) + '...');
  
  if (!n8nData.message) {
    console.error('❌ No message in n8n response:', n8nData);
    throw new Error('No message in n8n response');
  }

  return {
    response: n8nData.message,
    metadata: {
      model: n8nData.model || 'perplexity-sonar',
      usage: n8nData.usage || {},
      citations: n8nData.citations || [],
      search_results: n8nData.search_results || []
    }
  };
}

export function needsWebSearch(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced keyword detection
  const searchKeywords = [
    'research', 'study', 'latest', 'current', 'recent', 'news',
    'what is', 'tell me about', 'explain', 'information about',
    'details about', 'can you tell me', 'do you know about',
    'supplement', 'product', 'nutrition', 'ingredient',
    'benefits', 'effects', 'comparison', 'vs',
    'reviews', 'effectiveness', 'scientific evidence'
  ];
  
  // Check for search keywords
  const hasKeywords = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check for product names or specific terms that might need web search
  const specificTerms = [
    'in-perium', 'imperium', 'fortagen', 'x3 bar', 'x3 nutrition',
    'jaquish', 'biomedical', 'variable resistance'
  ];
  const hasSpecificTerms = specificTerms.some(term => lowerMessage.includes(term));
  
  // Check if it's a longer, detailed query
  const isLongQuery = message.length > 80;
  
  // Check for question patterns
  const questionPatterns = [
    /what (is|are|can you tell me about|do you know about)/,
    /tell me about/,
    /can you explain/,
    /how does .* work/,
    /what are the benefits of/,
    /is .* effective/
  ];
  const hasQuestionPattern = questionPatterns.some(pattern => pattern.test(lowerMessage));
  
  const shouldSearch = hasKeywords || hasSpecificTerms || isLongQuery || hasQuestionPattern;
  
  console.log('🔍 Web search analysis:');
  console.log('  - Has keywords:', hasKeywords);
  console.log('  - Has specific terms:', hasSpecificTerms);
  console.log('  - Is long query (>80 chars):', isLongQuery);
  console.log('  - Has question pattern:', hasQuestionPattern);
  console.log('  - Final decision: NEEDS WEB SEARCH =', shouldSearch);
  
  return shouldSearch;
}
