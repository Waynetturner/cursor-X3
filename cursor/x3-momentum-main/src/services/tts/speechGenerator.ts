
import { supabase } from '@/integrations/supabase/client';
import { VOICE_MAPPING, OpenAIVoice } from './types';

export class SpeechGenerator {
  async generateSpeech(text: string, voiceId: string): Promise<string | null> {
    console.log('Generating new audio for:', text);
    
    try {
      // Call Supabase Edge Function to generate speech
      const { data, error } = await supabase.functions.invoke('generate-speech', {
        body: {
          text: text,
          voice: VOICE_MAPPING[voiceId] || 'echo'
        }
      });

      if (error) {
        console.error('TTS Error:', error);
        return null;
      }

      if (!data?.audioContent) {
        console.warn('No audio content received, skipping TTS for:', text);
        return null;
      }

      return data.audioContent;
      
    } catch (error) {
      console.error('OpenAI TTS Error:', error);
      return null;
    }
  }
}
