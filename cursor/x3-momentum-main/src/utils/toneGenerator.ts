
import { AudioContextManager } from './audioContext';

export class ToneGenerator {
  private audioContextManager: AudioContextManager;
  private isCreatingTone = false;
  private lastToneTime = 0;

  constructor(audioContextManager: AudioContextManager) {
    this.audioContextManager = audioContextManager;
  }

  async createTone(): Promise<void> {
    // Prevent overlapping tone creation and rate limiting
    const now = Date.now();
    if (this.isCreatingTone || (now - this.lastToneTime) < 900) {
      return;
    }

    this.isCreatingTone = true;
    this.lastToneTime = now;

    try {
      const contextReady = await this.audioContextManager.initialize();
      if (!contextReady) {
        console.log('Pace Tone: Audio context not ready');
        return;
      }

      const ctx = this.audioContextManager.getContext();
      if (!ctx) {
        console.log('Pace Tone: No audio context available');
        return;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Soft, pleasant tone at 800Hz
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      // Quick, soft beep with smooth fade
      const currentTime = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.12);

      // Clean up after the tone completes
      oscillator.onended = () => {
        this.isCreatingTone = false;
      };

      console.log('Pace Tone: Tone created successfully');
    } catch (error) {
      console.error('Pace Tone: Error creating tone:', error);
    } finally {
      // Ensure flag is reset even if there's an error
      setTimeout(() => {
        this.isCreatingTone = false;
      }, 200);
    }
  }
}
