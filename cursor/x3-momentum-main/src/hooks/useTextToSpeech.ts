
import { useState, useCallback } from 'react';
import { openaiTTS } from '@/services/openaiTTS';

export const useTextToSpeech = () => {
  const [isSupported] = useState(() => true); // OpenAI TTS is always supported
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, voiceId: string = 'male') => {
    if (isSpeaking) {
      console.log('Already speaking, adding to queue');
    }

    setIsSpeaking(true);
    
    try {
      console.log(`Speaking with OpenAI TTS: "${text}" using voice: ${voiceId}`);
      await openaiTTS.speak(text, voiceId);
    } catch (error) {
      console.error('TTS Error:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const stop = useCallback(() => {
    // For now, we can't stop OpenAI TTS mid-speech
    // Could be enhanced to track audio elements and stop them
    setIsSpeaking(false);
  }, []);

  const preloadVoice = useCallback(async (voiceId: string) => {
    try {
      await openaiTTS.preloadCommonPhrases(voiceId);
    } catch (error) {
      console.warn('Failed to preload voice:', error);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    preloadVoice
  };
};
