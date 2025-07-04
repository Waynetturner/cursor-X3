import { UserDemographics, SimilarQuery } from './types.ts';

export function buildPersonalizedContext(userDemographics?: UserDemographics): string {
  if (!userDemographics) return '';

  return `

User Profile:
${userDemographics.age ? `Age: ${userDemographics.age}` : ''}
${userDemographics.gender ? `Gender: ${userDemographics.gender}` : ''}
${userDemographics.location ? `Location: ${userDemographics.location}` : ''}
${userDemographics.fitness_level ? `Fitness Level: ${userDemographics.fitness_level}` : ''}
${userDemographics.x3_program ? `X3 Program: ${userDemographics.x3_program}` : ''}
${userDemographics.goals ? `Goals: ${userDemographics.goals}` : ''}
${userDemographics.injury_history ? `Injury History: ${userDemographics.injury_history}` : ''}

Use this information to personalize your coaching advice and recommendations.`;
}

export function buildSimilarQueriesContext(similarQueries: SimilarQuery[]): string {
  if (!similarQueries || similarQueries.length === 0) return '';

  return `

Previous Related Conversations:
${similarQueries.map((q, index) => `
${index + 1}. Query: "${q.query}"
   Response: "${q.response.substring(0, 200)}..."
   Source: ${q.source_type}
   Date: ${new Date(q.created_at).toLocaleDateString()}
`).join('')}

Reference these previous conversations when relevant, but provide fresh insights and avoid repeating exact responses.`;
}

export function buildMessages(systemPrompt: string, conversationHistory: Array<{ role: string; content: string }>, currentMessage: string) {
  const messages = [{ role: 'system', content: systemPrompt }];
  
  // Add recent conversation history (last 8 messages to keep context manageable)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-8);
    for (const msg of recentHistory) {
      if (msg.role === 'coach') {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      } else if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msg.content
        });
      }
    }
  }

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage
  });

  return messages;
}
