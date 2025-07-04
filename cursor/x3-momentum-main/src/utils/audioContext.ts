
export class AudioContextManager {
  private audioContext: AudioContext | null = null;

  async initialize(): Promise<boolean> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Pace Tone: Audio context initialized');
      } catch (error) {
        console.error('Pace Tone: Failed to initialize audio context:', error);
        return false;
      }
    }

    // Always try to resume if suspended
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Pace Tone: Audio context resumed');
      } catch (error) {
        console.error('Pace Tone: Failed to resume audio context:', error);
        return false;
      }
    }

    return this.audioContext.state === 'running';
  }

  getContext(): AudioContext | null {
    return this.audioContext;
  }

  getState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  addEventListener(type: string, listener: EventListener): void {
    if (this.audioContext) {
      this.audioContext.addEventListener(type, listener);
    }
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.audioContext) {
      this.audioContext.removeEventListener(type, listener);
    }
  }

  async close(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.error('Pace Tone: Error closing audio context:', error);
      }
    }
  }
}
