'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Settings, TestTube, Save, X } from 'lucide-react'
import { useX3TTS, TTSVoice, type TTSSettings } from '@/hooks/useX3TTS'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface TTSSettingsProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export default function TTSSettings({ isOpen, onClose, className = '' }: TTSSettingsProps) {
  const { tier, hasFeature } = useSubscription()
  const { 
    settings, 
    voices, 
    saveTTSSettings, 
    speak, 
    isLoading, 
    error,
    isTTSAvailable 
  } = useX3TTS()
  
  const [localSettings, setLocalSettings] = useState<TTSSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Update local settings when settings change
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      const success = await saveTTSSettings(localSettings)
      if (success) {
        setSaveMessage('Settings saved successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Failed to save settings')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      setSaveMessage('Error saving settings')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestVoice = async () => {
    if (isTTSAvailable && localSettings.enabled) {
      const testText = "This is a test of the X3 Momentum Pro text-to-speech system."
      await speak(testText)
    }
  }

  const updateSetting = <K extends keyof TTSSettings>(
    key: K, 
    value: TTSSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`brand-card max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings size={20} className="text-orange-600" />
            <h2 className="text-subhead">TTS Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tier Status */}
        <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-orange-800">Current Tier</span>
            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 uppercase">
              {tier}
            </span>
          </div>
          <p className="text-xs text-orange-600 mt-1">
            {isTTSAvailable 
              ? 'TTS features are available for your tier'
              : 'Upgrade to Momentum or Mastery for TTS features'
            }
          </p>
        </div>

        {/* TTS Availability Warning */}
        {!isTTSAvailable && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <VolumeX size={16} className="text-gray-600" />
              <h3 className="font-medium text-gray-800">TTS Not Available</h3>
            </div>
            <p className="text-sm text-gray-600">
              Text-to-speech features require a Momentum or Mastery subscription. 
              Upgrade to unlock audio cues, voice coaching, and rest timer announcements.
            </p>
          </div>
        )}

        {/* Settings Form */}
        {isTTSAvailable && (
          <div className="space-y-6">
            {/* Enable/Disable TTS */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.enabled}
                  onChange={(e) => updateSetting('enabled', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <div>
                  <div className="font-medium text-primary">Enable TTS</div>
                  <div className="text-sm text-secondary">
                    Turn on audio cues and voice announcements
                  </div>
                </div>
              </label>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block font-medium text-primary mb-2">
                Voice Selection
              </label>
              <select
                value={localSettings.voice}
                onChange={(e) => updateSetting('voice', e.target.value)}
                disabled={!localSettings.enabled}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div>
              <label className="block font-medium text-primary mb-2">
                Speech Speed: {localSettings.speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={localSettings.speed}
                onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                disabled={!localSettings.enabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-secondary mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Volume Control */}
            <div>
              <label className="block font-medium text-primary mb-2">
                Volume: {Math.round(localSettings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localSettings.volume}
                onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                disabled={!localSettings.enabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-secondary mt-1">
                <span>Mute</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Test Button */}
            <div>
              <button
                onClick={handleTestVoice}
                disabled={!localSettings.enabled || isLoading}
                className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube size={16} />
                <span>Test Voice</span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Save Message */}
            {saveMessage && (
              <div className={`p-3 rounded-lg border ${
                saveMessage.includes('success') 
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-red-100 border-red-300 text-red-700'
              }`}>
                <p className="text-sm">{saveMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          {isTTSAvailable && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 