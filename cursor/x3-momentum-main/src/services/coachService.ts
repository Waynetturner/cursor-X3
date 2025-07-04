
import { supabase } from '@/integrations/supabase/client';
import { UserDemographics, Message } from '@/types/coach';

export const getUserDemographics = async (userId: string): Promise<UserDemographics | null> => {
  try {
    // Use RPC function to get demographics
    const { data, error } = await supabase
      .rpc('get_user_demographics', { p_user_id: userId });

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading demographics:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error loading demographics:', error);
    return null;
  }
};

export const saveUserMessage = async (userId: string, message: string) => {
  // Note: We're not saving individual messages since they're saved with responses
  console.log('User message will be saved with coach response');
};

export const searchSimilarQueries = async (userId: string, query: string, limit: number = 5) => {
  try {
    const { data, error } = await supabase
      .rpc('search_similar_queries', {
        p_user_id: userId,
        p_query: query,
        p_limit: limit
      });

    if (error) {
      console.error('Error searching similar queries:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error searching similar queries:', error);
    return [];
  }
};

export const saveAIResponse = async (
  userId: string, 
  query: string, 
  response: string, 
  sourceType: 'openai' | 'n8n_perplexity' = 'openai',
  metadata: any = {},
  confidenceScore?: number,
  n8nWorkflowId?: string
) => {
  try {
    const { error } = await supabase
      .from('ai_responses')
      .insert({
        user_id: userId,
        query,
        response,
        source_type: sourceType,
        metadata,
        confidence_score: confidenceScore,
        n8n_workflow_id: n8nWorkflowId,
        context_data: metadata
      });

    if (error) {
      console.error('Error saving AI response:', error);
    }
  } catch (error) {
    console.error('Error saving AI response:', error);
  }
};

export const callCoachAPI = async (
  message: string,
  userId: string,
  conversationHistory: Message[],
  userDemographics: UserDemographics | null,
  isWorkoutAnalysis: boolean = false
) => {
  console.log('Calling coach-chat function with:', {
    messageLength: message.length,
    userId,
    historyLength: conversationHistory.length,
    hasDemographics: !!userDemographics,
    isWorkoutAnalysis
  });

  // Search for similar queries before making the API call
  const similarQueries = await searchSimilarQueries(userId, message, 3);
  console.log('Found similar queries:', similarQueries.length);

  const { data, error } = await supabase.functions.invoke('coach-chat', {
    body: {
      message,
      userId,
      conversationHistory,
      userDemographics,
      isWorkoutAnalysis,
      similarQueries // Pass similar queries to the function
    }
  });

  if (error) {
    console.error('Error calling coach function:', error);
    console.error('Error details:', error.message);
    throw new Error(`Failed to get coach response: ${error.message}`);
  }

  if (!data) {
    console.error('No data received from coach function');
    throw new Error('No response received from coach');
  }

  console.log('Coach API response received successfully');
  
  // Save the AI response for future reference
  await saveAIResponse(
    userId,
    message,
    data.response,
    data.sourceType || 'openai',
    data.metadata || {},
    data.confidenceScore,
    data.n8nWorkflowId
  );

  return data;
};

export const loadConversationHistory = async (userId: string): Promise<Message[]> => {
  console.log('Loading conversation history for user:', userId);

  try {
    const { data, error } = await supabase
      .from('coach_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }

    console.log('Loaded conversation data:', data);

    // Convert the combined message/response format to separate messages
    const messages: Message[] = [];
    
    data?.forEach((conversation: any) => {
      // Add user message
      messages.push({
        id: `${conversation.id}-user`,
        role: 'user',
        content: conversation.user_message,
        timestamp: conversation.created_at
      });
      
      // Add coach response
      messages.push({
        id: `${conversation.id}-coach`,
        role: 'coach',
        content: conversation.coach_response,
        timestamp: conversation.created_at
      });
    });

    return messages;
  } catch (error) {
    console.error('Error loading conversation:', error);
    return [];
  }
};
