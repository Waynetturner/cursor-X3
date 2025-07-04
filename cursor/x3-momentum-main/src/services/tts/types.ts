
export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export const VOICE_MAPPING: Record<string, OpenAIVoice> = {
  'male': 'echo',     // Clear, confident male voice
  'female': 'nova'    // Warm, engaging female voice
};

export interface TTSCache {
  [key: string]: string; // base64 audio data
}

export interface QueueItem {
  text: string;
  voiceId: string;
}
