// N8N Integration Service for OpenAI Coaching
// This service handles communication with the N8N workflow for dynamic AI coaching

export interface N8NCoachingRequest {
  user_id: string;
  user_feedback: string;
  workout_data: any[];
  progress_history: any[];
  user_profile: any;
}

export interface N8NCoachingResponse {
  message: string;
  tts_message: string;
  tone: 'supportive' | 'motivational' | 'educational' | 'celebratory';
  confidence: number;
  suggestions?: string[];
  error?: string;
  success: boolean;
}

export class N8NIntegrationService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';
  }

  async sendCoachingRequest(request: N8NCoachingRequest): Promise<N8NCoachingResponse> {
    if (!this.webhookUrl) {
      throw new Error('N8N webhook URL not configured');
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.user_id,
          user_feedback: request.user_feedback,
          workout_data: request.workout_data,
          progress_history: request.progress_history,
          user_profile: request.user_profile,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`N8N request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.success) {
        throw new Error(data.error || 'N8N returned unsuccessful response');
      }

      return {
        message: data.message,
        tts_message: data.tts_message || data.message,
        tone: data.tone || 'supportive',
        confidence: data.confidence || 0.8,
        suggestions: data.suggestions,
        success: true,
      };

    } catch (error) {
      console.error('N8N integration error:', error);
      
      // Return fallback response
      return {
        message: "I understand your feedback. Keep pushing through - every workout builds strength and mental toughness.",
        tts_message: "I understand your feedback. Keep pushing through - every workout builds strength and mental toughness.",
        tone: 'supportive',
        confidence: 0.6,
        suggestions: ["Focus on form over speed", "Rest adequately between sets", "Listen to your body"],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test the N8N connection
  async testConnection(): Promise<boolean> {
    if (!this.webhookUrl) {
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('N8N connection test failed:', error);
      return false;
    }
  }

  // Get N8N workflow status
  async getWorkflowStatus(): Promise<{
    status: 'active' | 'inactive' | 'error';
    last_execution?: string;
    error_message?: string;
  }> {
    if (!this.webhookUrl) {
      return { status: 'inactive', error_message: 'Webhook URL not configured' };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'status',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return { status: 'error', error_message: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return {
        status: data.status || 'active',
        last_execution: data.last_execution,
        error_message: data.error_message,
      };

    } catch (error) {
      return { 
        status: 'error', 
        error_message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Singleton instance
export const n8nService = new N8NIntegrationService(); 