
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { searchSimilarQueries, saveAIResponse } from '@/services/coachService';

interface AIResponse {
  id: number;
  query: string;
  response: string;
  source_type: string;
  confidence_score: number | null;
  created_at: string;
}

export const useEnhancedCoach = () => {
  const { user } = useAuth();
  const [recentResponses, setRecentResponses] = useState<AIResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadSimilarQueries = async (query: string, limit: number = 5) => {
    if (!user) return [];

    try {
      setIsLoadingHistory(true);
      const queries = await searchSimilarQueries(user.id, query, limit);
      return queries;
    } catch (error) {
      console.error('Error loading similar queries:', error);
      return [];
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveResponse = async (
    query: string,
    response: string,
    sourceType: 'openai' | 'n8n_perplexity' = 'openai',
    metadata: any = {},
    confidenceScore?: number,
    n8nWorkflowId?: string
  ) => {
    if (!user) return;

    try {
      await saveAIResponse(
        user.id,
        query,
        response,
        sourceType,
        metadata,
        confidenceScore,
        n8nWorkflowId
      );
      
      // Refresh recent responses
      const recent = await searchSimilarQueries(user.id, '', 10);
      setRecentResponses(recent);
    } catch (error) {
      console.error('Error saving AI response:', error);
    }
  };

  const loadRecentResponses = async () => {
    if (!user) return;

    try {
      setIsLoadingHistory(true);
      const recent = await searchSimilarQueries(user.id, '', 10);
      setRecentResponses(recent);
    } catch (error) {
      console.error('Error loading recent responses:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecentResponses();
    }
  }, [user]);

  return {
    recentResponses,
    isLoadingHistory,
    loadSimilarQueries,
    saveResponse,
    loadRecentResponses
  };
};
