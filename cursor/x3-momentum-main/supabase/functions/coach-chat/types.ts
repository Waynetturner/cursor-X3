
export interface ChatRequest {
  message: string;
  userId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userDemographics?: UserDemographics;
  isWorkoutAnalysis?: boolean;
  similarQueries?: SimilarQuery[];
  enhancedResponse?: {
    model?: string;
    usage?: any;
    citations?: any[];
    search_results?: any[];
  };
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  location?: string;
  fitness_level?: string;
  x3_program?: string;
  goals?: string;
  injury_history?: string;
}

export interface SimilarQuery {
  query: string;
  response: string;
  source_type: string;
  created_at: string;
}

export interface N8nResponse {
  message?: string;
  model?: string;
  usage?: any;
  citations?: any[];
  search_results?: any[];
}

export interface ResponseMetadata {
  model: string;
  usage: any;
  citations?: any[];
  search_results?: any[];
}

export interface CoachResponse {
  response: string;
  sourceType: string;
  metadata: ResponseMetadata;
  similarQueriesUsed: number;
}
