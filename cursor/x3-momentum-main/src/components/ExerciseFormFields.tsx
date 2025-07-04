import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBandColorStyle } from '@/components/WorkoutHistory/bandColorUtils';

interface ExerciseFormFieldsProps {
  formData: {
    bandColor: string;
    fullReps: string;
    partialReps: string;
    notes: string;
  };
  setters: {
    setBandColor: (value: string) => void;
    setFullReps: (value: string) => void;
    setPartialReps: (value: string) => void;
    setNotes: (value: string) => void;
  };
  hasUserModifiedNotes?: boolean;
  previousNotes?: string;
  exerciseName: string;
}

const bandColors = [
  'White',
  'Light Gray', 
  'Dark Gray',
  'Black'
];

export const ExerciseFormFields = ({ 
  formData, 
  setters, 
  hasUserModifiedNotes = false, 
  previousNotes = '',
  exerciseName 
}: ExerciseFormFieldsProps) => {
  // For notes: show empty if user hasn't modified, otherwise show their input
  const getNotesDisplayValue = () => {
    if (hasUserModifiedNotes) {
      return formData.notes;
    }
    return '';
  };

  // For notes placeholder: show previous notes if available
  const getNotesPlaceholder = () => {
    if (previousNotes && !hasUserModifiedNotes) {
      return `Last time: "${previousNotes}"`;
    }
    return "Optional notes";
  };

  const baseId = exerciseName.toLowerCase().replace(/\s+/g, '-');

  console.log(`ExerciseFormFields ${exerciseName} render:`, {
    formData,
    hasUserModifiedNotes,
    previousNotes,
    displayValue: getNotesDisplayValue(),
    placeholder: getNotesPlaceholder()
  });

  return (
    <div className="space-y-3" role="group" aria-label={`${exerciseName} workout data entry`}>
      <div className="flex items-center gap-3">
        <label 
          htmlFor={`${baseId}-band`}
          className="min-w-20 text-gray-600 font-medium"
        >
          Band:
        </label>
        <div className="flex-1">
          <Select 
            value={formData.bandColor || ""} 
            onValueChange={(value) => {
              console.log(`Band color changing from "${formData.bandColor}" to "${value}"`);
              setters.setBandColor(value);
            }}
            name={`${baseId}-band`}
          >
            <SelectTrigger 
              id={`${baseId}-band`}
              aria-label={`Select resistance band color for ${exerciseName}. Current selection: ${formData.bandColor || 'none selected'}`}
              aria-required="true"
              className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500"
            >
              <SelectValue 
                placeholder="Select band color"
              />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
              {bandColors.map((color) => (
                <SelectItem 
                  key={color} 
                  value={color}
                  aria-label={`${color} resistance band`}
                  className="hover:bg-gray-100 focus:bg-gray-100"
                >
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      
      <div className="flex items-center gap-3">
        <label 
          htmlFor={`${baseId}-full-reps`}
          className="min-w-20 text-gray-600 font-medium"
        >
          Full Reps:
        </label>
        <Input
          id={`${baseId}-full-reps`}
          type="number"
          min="0"
          placeholder="e.g., 25"
          value={formData.fullReps}
          onChange={(e) => setters.setFullReps(e.target.value)}
          aria-label={`Number of full repetitions completed for ${exerciseName}`}
          aria-describedby={`${baseId}-full-reps-help`}
          aria-required="true"
          className={formData.fullReps ? "text-gray-900" : "text-gray-500"}
        />
        <span 
          id={`${baseId}-full-reps-help`} 
          className="sr-only"
        >
          Enter the number of complete repetitions you performed
        </span>
      </div>

      
      <div className="flex items-center gap-3">
        <label 
          htmlFor={`${baseId}-partial-reps`}
          className="min-w-20 text-gray-600 font-medium"
        >
          Partial:
        </label>
        <Input
          id={`${baseId}-partial-reps`}
          type="number"
          min="0"
          placeholder="e.g., 3"
          value={formData.partialReps}
          onChange={(e) => setters.setPartialReps(e.target.value)}
          aria-label={`Number of partial repetitions completed for ${exerciseName}`}
          aria-describedby={`${baseId}-partial-reps-help`}
          className={formData.partialReps ? "text-gray-900" : "text-gray-500"}
        />
        <span 
          id={`${baseId}-partial-reps-help`} 
          className="sr-only"
        >
          Enter the number of partial repetitions you performed after full reps
        </span>
      </div>

      
      <div className="flex items-center gap-3">
        <label 
          htmlFor={`${baseId}-notes`}
          className="min-w-20 text-gray-600 font-medium"
        >
          Notes:
        </label>
        <Input
          id={`${baseId}-notes`}
          placeholder={getNotesPlaceholder()}
          value={getNotesDisplayValue()}
          onChange={(e) => setters.setNotes(e.target.value)}
          aria-label={`Optional notes for ${exerciseName} exercise`}
          aria-describedby={`${baseId}-notes-help`}
        />
        <span 
          id={`${baseId}-notes-help`} 
          className="sr-only"
        >
          {previousNotes 
            ? `Last time you noted: ${previousNotes}. Add new notes or leave empty to keep previous notes.`
            : 'Add optional notes about your performance, form, or observations'
          }
        </span>
      </div>
    </div>
  );
};
