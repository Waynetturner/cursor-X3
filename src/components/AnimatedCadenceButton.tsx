

'use client';

import { useEffect, useRef } from 'react';

interface AnimatedCadenceButtonProps {
  cadenceActive: boolean;
  setCadenceActive: (active: boolean) => void;
}

const AnimatedCadenceButton: React.FC<AnimatedCadenceButtonProps> = ({ cadenceActive, setCadenceActive }) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playBeep = () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime); // 880 Hz
    gain.gain.setValueAtTime(0.1, context.currentTime); // Volume

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.1); // 100 ms
  };

  const toggleCadence = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setCadenceActive(false);
    } else {
      playBeep();
      intervalRef.current = setInterval(playBeep, 2000);
      setCadenceActive(true);
    }
  };

  // Sync with parent's cadence state
  useEffect(() => {
    if (cadenceActive) {
      // Start beeping when parent activates cadence
      if (!intervalRef.current) {
        playBeep(); // Initial beep
        intervalRef.current = setInterval(playBeep, 2000);
      }
    } else {
      // Stop beeping when parent deactivates cadence
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cadenceActive]);

return (
  <div className="flex justify-center w-full mt-4 mb-4">

    <div
      onClick={toggleCadence}
      role="button"
      aria-pressed={cadenceActive}
      aria-label={cadenceActive ? 'Stop cadence tone' : 'Start cadence tone'}
        className={`
    max-w-[300px] w-full h-[100px] cursor-pointer transition-transform duration-200
    ${cadenceActive ? 'scale-105 ring-4 ring-ember-red ring-opacity-30' : 'hover:scale-105'}
    mx-auto
  `}

    >
      <svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <title>X3 Momentum Cadence Button</title>
        <defs>
          <linearGradient id="orangeToRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#D32F2F" />
          </linearGradient>
          <clipPath id="revealClip">
            <rect x="50" y="25" rx="25" ry="25" width="50" height="50">
              <animate
                attributeName="width"
                values="50;300;50"
                dur="4s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1"
                keyTimes="0;0.5;1"
              />
            </rect>
          </clipPath>
        </defs>

        <rect x="50" y="25" rx="25" ry="25" width="50" height="50" fill="url(#orangeToRed)">
          <animate
            attributeName="width"
            values="50;300;50"
            dur="4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1"
            keyTimes="0;0.5;1"
          />
        </rect>

        <text
          x="200"
          y="60"
          fontFamily="Gotham, Montserrat, Inter, sans-serif"
          fontSize="25"
          fill="white"
          fontWeight="bold"
          textAnchor="middle"
          clipPath="url(#revealClip)"
        >
          <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
          X3MOMENTUM
        </text>
      </svg>
    </div>
  </div>
  );
};


export default AnimatedCadenceButton;
