'use client'

import { Play, Pause } from 'lucide-react'
import { announceToScreenReader } from '@/lib/accessibility'

export interface CadenceButtonProps {
  cadenceActive: boolean;
  setCadenceActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const CadenceButton: React.FC<CadenceButtonProps> = ({ 
  cadenceActive, 
  setCadenceActive 
}) => {
  const handleCadenceToggle = () => {
    setCadenceActive((prev) => {
      const newState = !prev
      // Provide immediate feedback
      if (newState) {
        console.log('🎵 Cadence Started: 2-second interval timer')
        announceToScreenReader('Cadence timer started with 2-second intervals', 'polite')
      } else {
        console.log('🎵 Cadence Stopped')
        announceToScreenReader('Cadence timer stopped', 'polite')
      }
      return newState
    })
  }

  return (
    <div className="w-full">
      <button
        onClick={handleCadenceToggle}
        className={`w-full px-8 py-4 font-bold flex items-center justify-center space-x-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transform hover:scale-105 ${
          cadenceActive 
            ? 'bg-ember-red hover:bg-red-600 text-white border-none' 
            : 'btn-primary'
        }`}
        style={cadenceActive ? { background: 'var(--ember-red)' } : {}}
        aria-pressed={cadenceActive}
        aria-label={cadenceActive ? 'Stop Cadence Timer' : 'Start Cadence Timer'}
      >
        {cadenceActive ? (
          <>
            <Pause size={20} />
            <span>Stop Cadence</span>
            <span className="text-xs bg-red-800 bg-opacity-20 px-2 py-1 rounded-full">
              🎵 Active
            </span>
          </>
        ) : (
          <>
            <Play size={20} />
            <span>Start Cadence (2s)</span>
          </>
        )}
      </button>
      
      {/* Cadence Status Indicator */}
      {cadenceActive && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Cadence Timer: 2 second intervals</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CadenceButton
