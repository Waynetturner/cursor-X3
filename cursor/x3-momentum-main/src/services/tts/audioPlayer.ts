
export class AudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private isDestroyed = false;

  constructor() {
    // Add cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  async playAudio(base64Audio: string): Promise<void> {
    if (this.isDestroyed) return;

    return new Promise((resolve) => {
      try {
        // Stop any existing audio first
        this.stopCurrentAudio();
        
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        this.currentAudio = audio;
        
        const cleanup = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.addEventListener('ended', cleanup, { once: true });
        audio.addEventListener('error', cleanup, { once: true });
        
        audio.play().catch(() => {
          cleanup();
        });
      } catch (error) {
        console.warn('Audio setup failed:', error);
        resolve();
      }
    });
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.removeEventListener('ended', this.handleAudioEnd);
      this.currentAudio.removeEventListener('error', this.handleAudioError);
      this.currentAudio = null;
    }
  }

  private handleAudioEnd = () => {
    this.currentAudio = null;
  };

  private handleAudioError = () => {
    console.warn('Audio playback failed');
    this.currentAudio = null;
  };

  cleanup() {
    this.isDestroyed = true;
    this.stopCurrentAudio();
  }
}
