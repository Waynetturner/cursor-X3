
import { useRef, useCallback } from 'react';
import { ToneGenerator } from '@/utils/toneGenerator';

export const useMetronome = (toneGenerator: ToneGenerator) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(async () => {
    if (intervalRef.current) {
      console.log('Pace Tone: Metronome already running');
      return;
    }
    
    console.log('Pace Tone: Starting metronome');
    
    // Create first tone immediately
    await toneGenerator.createTone();
    
    // Then continue with interval
    intervalRef.current = setInterval(() => {
      toneGenerator.createTone();
    }, 1000); // 1-second intervals
  }, [toneGenerator]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      console.log('Pace Tone: Stopping metronome');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const isRunning = useCallback(() => {
    return intervalRef.current !== null;
  }, []);

  return {
    start,
    stop,
    isRunning
  };
};
