
import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Volume2, VolumeX } from 'lucide-react';
import { announceToScreenReader } from '@/utils/accessibility';

interface PaceToneProps {
  isActive: boolean;
  onToggle: () => void;
}

export const PaceTone = ({ isActive, onToggle }: PaceToneProps) => {
  const handleToggle = () => {
    onToggle();
    const message = isActive 
      ? "Cadence tone turned off" 
      : "Cadence tone turned on - you will hear rhythmic beeps to help with exercise pacing";
    announceToScreenReader(message, 'polite');
  };

  return (
    <Toggle
      pressed={isActive}
      onPressedChange={handleToggle}
      aria-label={`Cadence tone control. Currently ${isActive ? 'on' : 'off'}. ${isActive ? 'Press to turn off rhythmic beeping' : 'Press to turn on rhythmic beeping for exercise pacing'}`}
      aria-describedby="cadence-description"
      className={`flex items-center gap-2 px-4 py-2 ${
        isActive 
          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
      style={{
        backgroundColor: isActive ? '#f27d20' : undefined,
      }}
    >
      {isActive ? (
        <Volume2 size={16} aria-hidden="true" />
      ) : (
        <VolumeX size={16} aria-hidden="true" />
      )}
      <span className="hidden sm:inline">Cadence</span>
      <span className="sm:hidden">{isActive ? 'On' : 'Off'}</span>
      <span id="cadence-description" className="sr-only">
        Cadence tone provides rhythmic beeping to help maintain consistent exercise pacing
      </span>
    </Toggle>
  );
};
