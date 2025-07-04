
import { TTSCacheManager } from './tts/cacheManager';
import { AudioPlayer } from './tts/audioPlayer';
import { SpeechGenerator } from './tts/speechGenerator';
import { QueueItem } from './tts/types';

export type { OpenAIVoice } from './tts/types';

class OpenAITTSService {
  private cacheManager: TTSCacheManager;
  private audioPlayer: AudioPlayer;
  private speechGenerator: SpeechGenerator;
  private audioQueue: QueueItem[] = [];
  private isProcessingQueue = false;
  private isDestroyed = false;

  constructor() {
    this.cacheManager = new TTSCacheManager();
    this.audioPlayer = new AudioPlayer();
    this.speechGenerator = new SpeechGenerator();
    
    // Add cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  async speak(text: string, voiceId: string): Promise<void> {
    if (this.isDestroyed) {
      console.warn('TTS service is destroyed, ignoring speak request');
      return;
    }

    console.log(`Queueing TTS: "${text}" with voice: ${voiceId}`);

    // Clear existing queue and stop current audio to prevent overlaps
    this.audioQueue = [];
    this.audioPlayer.stopCurrentAudio();
    
    // Add to queue
    this.audioQueue.push({ text, voiceId });
    
    if (!this.isProcessingQueue) {
      this.processAudioQueue();
    }
  }

  private async processAudioQueue(): Promise<void> {
    if (this.isProcessingQueue || this.audioQueue.length === 0 || this.isDestroyed) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.audioQueue.length > 0 && !this.isDestroyed) {
        const { text, voiceId } = this.audioQueue.shift()!;
        
        try {
          console.log(`Processing TTS: "${text}"`);
          await this.playAudioDirectly(text, voiceId);
          // Longer pause between audio clips to prevent cutting off
          if (!this.isDestroyed && this.audioQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } catch (error) {
          console.error('Error playing audio:', error);
          // Continue with next item in queue even if one fails
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async playAudioDirectly(text: string, voiceId: string): Promise<void> {
    if (this.isDestroyed) return;

    // Stop any currently playing audio first
    this.audioPlayer.stopCurrentAudio();
    
    const cacheKey = this.cacheManager.getCacheKey(text, voiceId);
    
    // Check cache first
    const cachedAudio = this.cacheManager.get(cacheKey);
    if (cachedAudio) {
      console.log('Playing cached audio for:', text);
      await this.audioPlayer.playAudio(cachedAudio);
      return;
    }

    // Generate new audio
    console.log('Generating new speech for:', text);
    try {
      const audioContent = await this.speechGenerator.generateSpeech(text, voiceId);
      if (!audioContent || this.isDestroyed) {
        console.warn('No audio content generated for:', text);
        return;
      }

      // Cache the audio
      this.cacheManager.set(cacheKey, audioContent);

      // Play the audio
      if (!this.isDestroyed) {
        console.log('Playing generated audio for:', text);
        await this.audioPlayer.playAudio(audioContent);
      }
    } catch (error) {
      console.error('Failed to generate or play audio:', error);
      // Don't throw here, just log and continue
    }
  }

  // Preload common phrases for better UX
  async preloadCommonPhrases(voiceId: string) {
    if (this.isDestroyed) return;

    const commonPhrases = [
      "Exercise saved and recorded",
      "Workout completed", 
      "Set recorded",
      "Nice work! All exercises completed. Click Finish Workout and Get Coach Analysis in the coach section below to get your personalized feedback.",
      "That's all done. You can now finish your workout in the coach section below."
    ];

    console.log(`Preloading common phrases for ${voiceId}...`);
    
    for (const phrase of commonPhrases) {
      if (this.isDestroyed) break;
      
      const cacheKey = this.cacheManager.getCacheKey(phrase, voiceId);
      if (!this.cacheManager.get(cacheKey)) {
        try {
          const audioContent = await this.speechGenerator.generateSpeech(phrase, voiceId);
          if (audioContent && !this.isDestroyed) {
            this.cacheManager.set(cacheKey, audioContent);
          }
          // Small delay to avoid overwhelming the API
          if (!this.isDestroyed) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.warn(`Failed to preload phrase "${phrase}":`, error);
        }
      }
    }
  }

  cleanup() {
    this.isDestroyed = true;
    this.audioPlayer.cleanup();
    this.audioQueue = [];
    this.isProcessingQueue = false;
  }

  clearCache() {
    this.cleanup();
    this.cacheManager.clear();
  }
}

export const openaiTTS = new OpenAITTSService();
