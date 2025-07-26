'use client'

import { Save, Info, Target, CheckCircle, Loader2 } from 'lucide-react'

interface Exercise {
  id?: string;
  exercise_name: string;
  band_color: string;
  full_reps: number;
  partial_reps: number;
  notes: string;
  saved: boolean;
  previousData?: unknown;
  workout_local_date_time: string;
  name: string;
  band: string;
  fullReps: number;
  partialReps: number;
  lastWorkout: string;
  lastWorkoutDate: string;
}

export interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  exerciseState: 'idle' | 'started' | 'in_progress' | 'completed';
  isSaveLoading: boolean;
  saveError: string | null;
  ttsActive: boolean;
  bandColors: string[];
  onUpdateExercise: (index: number, field: string, value: string | number) => void;
  onSaveExercise: (index: number) => void;
  onRetrySave: (index: number) => void;
  onStartExercise?: (index: number) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  exerciseState,
  isSaveLoading,
  saveError,
  ttsActive,
  bandColors,
  onUpdateExercise,
  onSaveExercise,
  onRetrySave,
  onStartExercise
}) => {
  const getExerciseInfoUrl = (exerciseName: string) => {
    const exerciseUrls: { [key: string]: string } = {
      'Chest Press': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-chest-press/',
      'Tricep Press': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-tricep-press/',
      'Overhead Press': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-overhead-press/',
      'Front Squat': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-front-squat/',
      'Deadlift': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-deadlift/',
      'Bent Row': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-bent-row/',
      'Bicep Curl': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-bicep-curl/',
      'Calf Raise': 'https://www.jaquishbiomedical.com/x3-program/exercise-form/x3-calf-raise/'
    }
    return exerciseUrls[exerciseName] || 'https://www.jaquishbiomedical.com/x3-program/'
  }

  return (
    <article className="brand-card">
      <header className="mb-4">
        {/* NEW DESIGN: Exercise title - 25% larger, centered, ALLCAPS with highest rep count */}
        <div className="text-center mb-4 relative">
          <h3 
            className="font-semibold brand-fire mb-4"
            style={{
              fontSize: '22.5px', // 25% larger than 18px text-body-large
              lineHeight: '1.3',
              letterSpacing: '0.5px'
            }}
          >
            {exercise.name.toUpperCase()}
          </h3>
          
          {/* Info button moved to top right corner */}
          <div className="absolute top-0 right-0">
            <a
              href={getExerciseInfoUrl(exercise.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-secondary hover:text-fire transition-colors"
              aria-label={`Learn more about ${exercise.name} on Jaquish Biomedical website`}
            >
              <Info size={16} aria-hidden="true" />
            </a>
          </div>
          
          
        </div>
      </header>
      
      <div className="mb-4">
        <label htmlFor={`band-${exercise.name}`} className="block text-label mb-2 text-secondary">
          Band Color
        </label>
        <select
          id={`band-${exercise.name}`}
          value={exercise.band}
          onChange={(e) => onUpdateExercise(index, 'band', e.target.value)}
          className="w-full bg-white border border-subtle rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary"
        >
          {bandColors.map(color => (
            <option key={color} value={color} className="bg-white text-primary">
              {color} Band
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor={`full-reps-${exercise.name}`} className="block text-label mb-1 text-secondary">
            Full Reps
          </label>
          <input
            id={`full-reps-${exercise.name}`}
            type="number"
            value={exercise.fullReps || ''}
            onChange={(e) => onUpdateExercise(index, 'fullReps', parseInt(e.target.value) || 0)}
            className="w-full bg-white border border-subtle rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary"
            min="0"
            max="999"
          />
        </div>
        <div>
          <label htmlFor={`partial-reps-${exercise.name}`} className="block text-label mb-1 text-secondary">
            Partial Reps
          </label>
          <input
            id={`partial-reps-${exercise.name}`}
            type="number"
            value={exercise.partialReps || ''}
            onChange={(e) => onUpdateExercise(index, 'partialReps', parseInt(e.target.value) || 0)}
            className="w-full bg-white border border-subtle rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary"
            min="0"
            max="999"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor={`notes-${exercise.name}`} className="block text-label mb-1 text-secondary">
          Notes
        </label>
        <textarea
          id={`notes-${exercise.name}`}
          value={exercise.notes}
          onChange={(e) => onUpdateExercise(index, 'notes', e.target.value)}
          className="w-full bg-white border border-subtle rounded-xl px-3 py-2 text-body-small focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-primary placeholder-gray-500"
          rows={2}
          placeholder="Comments"
        />
      </div>

      {/* Exercise Status Indicator */}
      {!exercise.saved && (
        <div className="mb-3">
          {/* Exercise State Banner */}
          {exerciseState && exerciseState !== 'idle' && (
            <div className={`p-2 rounded-lg mb-2 flex items-center space-x-2 ${
              exerciseState === 'started' ? 'bg-yellow-100 border border-yellow-300' :
              exerciseState === 'in_progress' ? 'bg-blue-100 border border-blue-300' :
              exerciseState === 'completed' ? 'bg-green-100 border border-green-300' : ''
            }`}>
              {exerciseState === 'started' && (
                <>
                  <Loader2 className="animate-spin text-yellow-600" size={16} />
                  <span className="text-yellow-800 text-sm font-medium">Exercise Starting...</span>
                  {ttsActive && (
                    <span className="text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">
                      🔊 TTS Active
                    </span>
                  )}
                </>
              )}
              {exerciseState === 'in_progress' && (
                <>
                  <Target className="text-blue-600" size={16} />
                  <span className="text-blue-800 text-sm font-medium">Exercise In Progress</span>
                </>
              )}
              {exerciseState === 'completed' && (
                <>
                  <CheckCircle className="text-green-600" size={16} />
                  <span className="text-green-800 text-sm font-medium">Exercise Completed</span>
                </>
              )}
            </div>
          )}


          {/* Exercise Progress Indicator */}
          {exerciseState === 'in_progress' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="text-blue-600 animate-pulse" size={20} />
                <span className="text-blue-800 font-medium">Exercise Active</span>
              </div>
              <p className="text-blue-700 text-sm">
                Complete your reps and click Save when finished.
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onSaveExercise(index)}
        disabled={exercise.saved || isSaveLoading}
        className={`w-full py-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
          exercise.saved
            ? 'btn-success cursor-default focus:ring-green-500'
            : isSaveLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed focus:ring-gray-400'
              : 'btn-primary focus:ring-orange-500'
        }`}
      >
        {isSaveLoading ? (
          <>
            <Loader2 className="inline mr-2 animate-spin" size={16} aria-hidden="true" />
            Saving...
          </>
        ) : exercise.saved ? (
          <>
            <Save className="inline mr-2" size={16} aria-hidden="true" />
            Saved!
          </>
        ) : (
          <>
            <Save className="inline mr-2" size={16} aria-hidden="true" />
            Save Exercise
          </>
        )}
      </button>
    </article>
  )
}

export default ExerciseCard
