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

  const getCardElevation = () => {
    if (exerciseState === 'completed') return 'card-elevation-1'
    if (exerciseState === 'in_progress') return 'card-floating'
    if (exerciseState === 'started') return 'card-elevation-2'
    return 'card-elevation-1'
  }

  return (
    <article 
      className={`
        ${getCardElevation()} 
        bg-white rounded-xl p-6 transition-all duration-300 ease-out
        transform hover:scale-[1.02] hover:rotate-[0.5deg]
        ${exerciseState === 'in_progress' ? 'ring-2 ring-orange-500/20' : ''}
        ${exerciseState === 'completed' ? 'ring-2 ring-green-500/20' : ''}
      `}
      style={{
        transformOrigin: 'center',
        willChange: 'transform, box-shadow'
      }}
    >
      <header className="mb-4">
        {/* NEW DESIGN: Exercise title - 25% larger, centered, ALLCAPS with highest rep count */}
        <div className="text-center mb-4 relative">
          <h3 className="text-title-large brand-fire mb-4 font-bold tracking-wide">
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
      
      <div className="mb-5">
        <label htmlFor={`band-${exercise.name}`} className="block text-label-large mb-3 text-secondary font-medium">
          Band Color
        </label>
        <select
          id={`band-${exercise.name}`}
          value={exercise.band}
          onChange={(e) => onUpdateExercise(index, 'band', e.target.value)}
          className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-primary transition-all duration-200 hover:border-gray-300 cursor-pointer min-h-[44px]"
        >
          {bandColors.map(color => (
            <option key={color} value={color} className="bg-white text-primary py-2">
              {color} Band
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label htmlFor={`full-reps-${exercise.name}`} className="block text-label-large mb-2 text-secondary font-medium">
            Full Reps
          </label>
          <input
            id={`full-reps-${exercise.name}`}
            type="number"
            value={exercise.fullReps || ''}
            onChange={(e) => onUpdateExercise(index, 'fullReps', parseInt(e.target.value) || 0)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-body-large font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-primary transition-all duration-200 hover:border-gray-300 min-h-[44px]"
            min="0"
            max="999"
            inputMode="numeric"
          />
        </div>
        <div>
          <label htmlFor={`partial-reps-${exercise.name}`} className="block text-label-large mb-2 text-secondary font-medium">
            Partial Reps
          </label>
          <input
            id={`partial-reps-${exercise.name}`}
            type="number"
            value={exercise.partialReps || ''}
            onChange={(e) => onUpdateExercise(index, 'partialReps', parseInt(e.target.value) || 0)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-body-large font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-primary transition-all duration-200 hover:border-gray-300 min-h-[44px]"
            min="0"
            max="999"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor={`notes-${exercise.name}`} className="block text-label-large mb-2 text-secondary font-medium">
          Notes
        </label>
        <textarea
          id={`notes-${exercise.name}`}
          value={exercise.notes}
          onChange={(e) => onUpdateExercise(index, 'notes', e.target.value)}
          className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-primary placeholder-gray-400 transition-all duration-200 hover:border-gray-300 resize-none"
          rows={2}
          placeholder="Add comments about this exercise..."
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
        className={`
          w-full py-4 rounded-xl font-bold text-body-emphasized
          focus:outline-none focus:ring-4 focus:ring-offset-2 
          transition-all duration-200 transform active:scale-95
          min-h-[52px] flex items-center justify-center
          ${exercise.saved
            ? 'bg-green-500 text-white cursor-default focus:ring-green-500/30 shadow-lg'
            : isSaveLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed focus:ring-gray-400/30'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white focus:ring-orange-500/30 shadow-lg hover:shadow-xl hover:scale-[1.02]'
          }
        `}
        style={{
          willChange: 'transform, box-shadow'
        }}
      >
        {isSaveLoading ? (
          <>
            <Loader2 className="inline mr-2 animate-spin" size={18} aria-hidden="true" />
            <span>Saving...</span>
          </>
        ) : exercise.saved ? (
          <>
            <Save className="inline mr-2" size={18} aria-hidden="true" />
            <span>Saved!</span>
          </>
        ) : (
          <>
            <Save className="inline mr-2" size={18} aria-hidden="true" />
            <span>Save Exercise</span>
          </>
        )}
      </button>
    </article>
  )
}

export default ExerciseCard
