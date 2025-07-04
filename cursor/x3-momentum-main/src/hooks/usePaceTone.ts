
import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioContextManager } from '@/utils/audioContext';
import { ToneGenerator } from '@/utils/toneGenerator';
import { useMetronome } from './useMetronome';

export const usePaceTone = () => {
  const [isActive, setIsActive] = useState(false);
  const audioContextManagerRef = useRef<AudioContextManager | null>(null);
  const toneGeneratorRef = useRef<ToneGenerator | null>(null);

  // Initialize audio utilities
  if (!audioContextManagerRef.current) {
    audioContextManagerRef.current = new AudioContextManager();
  }
  
  if (!toneGeneratorRef.current && audioContextManagerRef.current) {
    toneGeneratorRef.current = new ToneGenerator(audioContextManagerRef.current);
  }

  const metronome = useMetronome(toneGeneratorRef.current!);

  const toggle = useCallback(() => {
    console.log('Pace Tone: Toggling pace tone');
    setIsActive(prev => {
      const newState = !prev;
      console.log(`Pace Tone: Setting active to ${newState}`);
      return newState;
    });
  }, []);

  const turnOff = useCallback(() => {
    console.log('Pace Tone: Turning off pace tone');
    setIsActive(false);
  }, []);

  // Main effect for starting/stopping metronome
  useEffect(() => {
    console.log(`Pace Tone: Effect triggered, isActive: ${isActive}`);
    if (isActive) {
      metronome.start();
    } else {
      metronome.stop();
    }

    return () => {
      console.log('Pace Tone: Cleanup from main effect');
      metronome.stop();
    };
  }, [isActive, metronome]);

  // Handle page visibility changes - but don't auto-restart to prevent confusion
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        console.log('Pace Tone: Page hidden, pausing metronome');
        metronome.stop();
      } else if (!document.hidden && isActive && !metronome.isRunning()) {
        console.log('Pace Tone: Page visible, resuming metronome');
        // Small delay to ensure page is fully active
        setTimeout(() => {
          if (isActive && !metronome.isRunning()) {
            metronome.start();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, metronome]);

  // Handle audio context interruptions
  useEffect(() => {
    const handleAudioContextStateChange = () => {
      const audioContextManager = audioContextManagerRef.current;
      if (audioContextManager && isActive) {
        const state = audioContextManager.getState();
        console.log('Pace Tone: Audio context state changed to:', state);
        
        if (state === 'suspended') {
          // Don't automatically resume - let the user interaction handle it
          console.log('Pace Tone: Audio context suspended, metronome may pause');
        } else if (state === 'running' && !metronome.isRunning()) {
          // Restart if we were supposed to be running but aren't
          console.log('Pace Tone: Audio context running again, restarting metronome');
          metronome.start();
        }
      }
    };

    const audioContextManager = audioContextManagerRef.current;
    if (audioContextManager) {
      audioContextManager.addEventListener('statechange', handleAudioContextStateChange);
      
      return () => {
        audioContextManager.removeEventListener('statechange', handleAudioContextStateChange);
      };
    }
  }, [isActive, metronome]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Pace Tone: Component unmounting, cleaning up');
      metronome.stop();
      const audioContextManager = audioContextManagerRef.current;
      if (audioContextManager) {
        audioContextManager.close();
      }
    };
  }, [metronome]);

  return {
    isActive,
    toggle,
    turnOff
  };
};
