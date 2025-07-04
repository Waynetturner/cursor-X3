
import { TTSCache } from './types';

export class TTSCacheManager {
  private cache: TTSCache = {};
  private readonly CACHE_KEY = 'openai_tts_cache';

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load TTS cache:', error);
      this.cache = {};
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save TTS cache:', error);
    }
  }

  getCacheKey(text: string, voiceId: string): string {
    return `${voiceId}_${btoa(text).replace(/[/+=]/g, '')}`;
  }

  get(cacheKey: string): string | undefined {
    return this.cache[cacheKey];
  }

  set(cacheKey: string, audioData: string): void {
    this.cache[cacheKey] = audioData;
    this.saveCache();
  }

  clear(): void {
    this.cache = {};
    localStorage.removeItem(this.CACHE_KEY);
  }
}
