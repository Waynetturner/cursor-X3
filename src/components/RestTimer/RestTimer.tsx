'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { useX3TTS } from '@/hooks/useX3TTS'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface RestTimerProps {
  duration?: number // in seconds
  onComplete?: () => void
  className?: string
}

export default function RestTimer({ 
  duration = 90, 
  onComplete, 
  className = '' 
}: RestTimerProps) {
  const { tier, hasFeature } = useSubscription()
  const { speak, settings } = useX3TTS()
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showTTSWarning, setShowTTSWarning] = useState(false)

  const isRestTimerAvailable = hasFeature('restTimer')
  const isTTSAvailable = hasFeature('ttsAudioCues')

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get progress percentage
  const progress = ((duration - timeLeft) / duration) * 100

  // TTS announcements
  const announceTime = useCallback((seconds: number) => {
    if (!isTTSAvailable || !settings.enabled) return

    if (seconds === 60) {
      speak("One minute remaining in your rest period.")
    } else if (seconds === 30) {
      speak("Thirty seconds left. Get ready for your next set.")
    } else if (seconds === 10) {
      speak("Ten seconds. Prepare to begin.")
    } else if (seconds === 5) {
      speak("Five, four, three, two, one. Begin your next set!")
    }
  }, [isTTSAvailable, settings.enabled, speak])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1
          
          // Announce at specific intervals
          if ([60, 30, 10, 5].includes(newTime)) {
            announceTime(newTime)
          }
          
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isPaused, timeLeft, announceTime])

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      if (isTTSAvailable && settings.enabled) {
        speak("Rest period complete. Time to get back to work!")
      }
      onComplete?.()
    }
  }, [timeLeft, isRunning, isTTSAvailable, settings.enabled, speak, onComplete])

  const startTimer = () => {
    if (!isRestTimerAvailable) {
      setShowTTSWarning(true)
      setTimeout(() => setShowTTSWarning(false), 3000)
      return
    }
    
    setIsRunning(true)
    setIsPaused(false)
    if (isTTSAvailable && settings.enabled) {
      speak("Rest timer started. Take a deep breath and relax.")
    }
  }

  const pauseTimer = () => {
    setIsPaused(true)
    if (isTTSAvailable && settings.enabled) {
      speak("Timer paused.")
    }
  }

  const resumeTimer = () => {
    setIsPaused(false)
    if (isTTSAvailable && settings.enabled) {
      speak("Timer resumed.")
    }
  }

  const resetTimer = () => {
    setTimeLeft(duration)
    setIsRunning(false)
    setIsPaused(false)
    if (isTTSAvailable && settings.enabled) {
      speak("Timer reset.")
    }
  }

  const toggleTTS = () => {
    // This would typically update settings, but for now we'll just show a message
    if (isTTSAvailable) {
      speak(settings.enabled ? "Audio cues disabled." : "Audio cues enabled.")
    }
  }

  if (!isRestTimerAvailable) {
    return (
      <div className={`brand-card ${className}`}>
        <div className="text-center">
          <h3 className="text-subhead mb-2">Rest Timer</h3>
          <p className="text-secondary mb-4">
            Upgrade to Momentum or Mastery to access the rest timer with audio cues.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-mono font-bold text-gray-400">
              {formatTime(duration)}
            </div>
            <div className="text-sm text-gray-500 mt-2">Timer Locked</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`brand-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-subhead">Rest Timer</h3>
        <div className="flex items-center space-x-2">
          {isTTSAvailable && (
            <button
              onClick={toggleTTS}
              className={`p-2 rounded-lg transition-colors ${
                settings.enabled 
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={settings.enabled ? 'Disable audio cues' : 'Enable audio cues'}
            >
              {settings.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
            {tier}
          </span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="relative">
          {/* Progress Ring */}
          <svg className="w-32 h-32 mx-auto" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#FF6B35"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-primary">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-secondary mt-1">
                {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-3">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="btn-primary flex items-center space-x-2"
          >
            <Play size={16} />
            <span>Start</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeTimer}
                className="btn-primary flex items-center space-x-2"
              >
                <Play size={16} />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="btn-secondary flex items-center space-x-2"
              >
                <Pause size={16} />
                <span>Pause</span>
              </button>
            )}
            <button
              onClick={resetTimer}
              className="btn-secondary flex items-center space-x-2"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </>
        )}
      </div>

      {/* TTS Status */}
      {isTTSAvailable && (
        <div className="mt-4 text-center">
          <div className="text-xs text-secondary">
            {settings.enabled ? 'Audio cues enabled' : 'Audio cues disabled'}
          </div>
        </div>
      )}

      {/* Warning Message */}
      {showTTSWarning && (
        <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
          <p className="text-sm text-orange-700 text-center">
            Rest timer requires Momentum or Mastery subscription
          </p>
        </div>
      )}
    </div>
  )
} 