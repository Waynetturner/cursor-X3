// Backend Integration Service
// This service handles all backend operations including Supabase, Edge Functions, and N8N

import { supabase } from './supabase'
import { n8nService, N8NCoachingRequest } from './n8n-integration'
import { BACKEND_CONFIG } from './backend-config'

export interface BackendStatus {
  supabase: {
    connected: boolean;
    tables: {
      workout_exercises: boolean;
      profiles: boolean;
      user_ui_settings: boolean;
    };
  };
  edgeFunctions: {
    generate_speech: boolean;
    coach_chat: boolean;
  };
  n8n: {
    connected: boolean;
    status: 'active' | 'inactive' | 'error';
  };
  environment: {
    configured: boolean;
    missing_vars: string[];
  };
}

export interface CoachingRequest {
  user_id: string;
  user_feedback?: string;
  workout_data?: any[];
  progress_history?: any[];
  coaching_type: 'static' | 'dynamic';
}

export interface CoachingResponse {
  message: string;
  tts_message: string;
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory';
  confidence: number;
  suggestions?: string[];
  success: boolean;
  error?: string;
}

export class BackendIntegrationService {
  private supabaseUrl: string;
  private edgeFunctionUrl: string;

  constructor() {
    this.supabaseUrl = BACKEND_CONFIG.supabase.url || '';
    this.edgeFunctionUrl = this.supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1');
  }

  // Check overall backend status
  async getBackendStatus(): Promise<BackendStatus> {
    const status: BackendStatus = {
      supabase: {
        connected: false,
        tables: {
          workout_exercises: false,
          profiles: false,
          user_ui_settings: false,
        },
      },
      edgeFunctions: {
        generate_speech: false,
        coach_chat: false,
      },
      n8n: {
        connected: false,
        status: 'inactive',
      },
      environment: {
        configured: false,
        missing_vars: [],
      },
    };

    // Check environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    status.environment.missing_vars = missingVars;
    status.environment.configured = missingVars.length === 0;

    // Check Supabase connection
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      status.supabase.connected = !error && !!user;

      // Check table access
      if (status.supabase.connected) {
        status.supabase.tables.workout_exercises = await this.testTableAccess('workout_exercises');
        status.supabase.tables.profiles = await this.testTableAccess('profiles');
        status.supabase.tables.user_ui_settings = await this.testTableAccess('user_ui_settings');
      }
    } catch (error) {
      console.error('Supabase connection test failed:', error);
    }

    // Check Edge Functions
    try {
      status.edgeFunctions.generate_speech = await this.testEdgeFunction('generate-speech');
      status.edgeFunctions.coach_chat = await this.testEdgeFunction('coach-chat');
    } catch (error) {
      console.error('Edge function tests failed:', error);
    }

    // Check N8N
    try {
      const n8nStatus = await n8nService.getWorkflowStatus();
      status.n8n.connected = n8nStatus.status === 'active';
      status.n8n.status = n8nStatus.status;
    } catch (error) {
      console.error('N8N status check failed:', error);
    }

    return status;
  }

  // Test table access
  private async testTableAccess(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error(`Table access test failed for ${tableName}:`, error);
      return false;
    }
  }

  // Test Edge Function
  private async testEdgeFunction(functionName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.edgeFunctionUrl}/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BACKEND_CONFIG.supabase.anonKey}`,
        },
        body: JSON.stringify({ test: true }),
      });

      return response.ok;
    } catch (error) {
      console.error(`Edge function test failed for ${functionName}:`, error);
      return false;
    }
  }

  // Get coaching response
  async getCoachingResponse(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      // Route to appropriate coaching system
      if (request.coaching_type === 'static') {
        return await this.getStaticCoaching(request);
      } else if (request.coaching_type === 'dynamic') {
        return await this.getDynamicCoaching(request);
      } else {
        throw new Error('Invalid coaching type');
      }
    } catch (error) {
      console.error('Coaching request failed:', error);
      return {
        message: "I'm here to support your X3 journey. Keep pushing through!",
        tts_message: "I'm here to support your X3 journey. Keep pushing through!",
        tone: 'supportive',
        confidence: 0.5,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Static coaching (Momentum tier)
  private async getStaticCoaching(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      const response = await fetch(`${this.edgeFunctionUrl}/coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BACKEND_CONFIG.supabase.anonKey}`,
        },
        body: JSON.stringify({
          user_id: request.user_id,
          user_feedback: request.user_feedback || '',
          workout_data: request.workout_data || [],
          progress_history: request.progress_history || [],
          coaching_type: 'static',
        }),
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Static coaching failed:', error);
      throw error;
    }
  }

  // Dynamic coaching (Mastery tier) - via N8N
  private async getDynamicCoaching(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      // First try N8N integration
      const n8nRequest: N8NCoachingRequest = {
        user_id: request.user_id,
        user_feedback: request.user_feedback || '',
        workout_data: request.workout_data || [],
        progress_history: request.progress_history || [],
        user_profile: await this.getUserProfile(request.user_id),
      };

      const n8nResponse = await n8nService.sendCoachingRequest(n8nRequest);
      
      if (n8nResponse.success) {
        return n8nResponse;
      }

      // Fallback to Edge Function
      const response = await fetch(`${this.edgeFunctionUrl}/coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BACKEND_CONFIG.supabase.anonKey}`,
        },
        body: JSON.stringify({
          user_id: request.user_id,
          user_feedback: request.user_feedback || '',
          workout_data: request.workout_data || [],
          progress_history: request.progress_history || [],
          coaching_type: 'dynamic',
        }),
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Dynamic coaching failed:', error);
      throw error;
    }
  }

  // Get user profile
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Generate speech
  async generateSpeech(text: string, userId: string, voice?: string, speed?: number, context?: string): Promise<{ audio_url?: string; error?: string; success: boolean }> {
    try {
      const response = await fetch(`${this.edgeFunctionUrl}/generate-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BACKEND_CONFIG.supabase.anonKey}`,
        },
        body: JSON.stringify({
          text,
          user_id: userId,
          voice: voice || 'ash',
          speed: speed || 1.0,
          context: context || 'general',
        }),
      });

      if (!response.ok) {
        throw new Error(`Speech generation error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Speech generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test data flow: UI → Supabase → Edge Functions → N8N → back to UI
  async testDataFlow(): Promise<{
    step1_ui_to_supabase: boolean;
    step2_supabase_to_edge: boolean;
    step3_edge_to_n8n: boolean;
    step4_n8n_to_ui: boolean;
    overall_success: boolean;
    errors: string[];
  }> {
    const result = {
      step1_ui_to_supabase: false,
      step2_supabase_to_edge: false,
      step3_edge_to_n8n: false,
      step4_n8n_to_ui: false,
      overall_success: false,
      errors: [] as string[],
    };

    try {
      // Step 1: Test UI to Supabase connection
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        result.step1_ui_to_supabase = true;
      } else {
        result.errors.push('No authenticated user found');
      }

      // Step 2: Test Supabase to Edge Function connection
      const edgeTest = await this.testEdgeFunction('coach-chat');
      result.step2_supabase_to_edge = edgeTest;
      if (!edgeTest) {
        result.errors.push('Edge function test failed');
      }

      // Step 3: Test Edge Function to N8N connection
      const n8nStatus = await n8nService.getWorkflowStatus();
      result.step3_edge_to_n8n = n8nStatus.status === 'active';
      if (n8nStatus.status !== 'active') {
        result.errors.push(`N8N status: ${n8nStatus.status}`);
      }

      // Step 4: Test N8N to UI response
      if (user && result.step3_edge_to_n8n) {
        const coachingResponse = await this.getCoachingResponse({
          user_id: user.id,
          user_feedback: 'Test feedback',
          coaching_type: 'dynamic',
        });
        result.step4_n8n_to_ui = coachingResponse.success;
        if (!coachingResponse.success) {
          result.errors.push('Coaching response failed');
        }
      }

      result.overall_success = result.step1_ui_to_supabase && 
                              result.step2_supabase_to_edge && 
                              result.step3_edge_to_n8n && 
                              result.step4_n8n_to_ui;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }
}

// Singleton instance
export const backendService = new BackendIntegrationService(); 