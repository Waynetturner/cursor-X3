'use client'

import React from 'react'
import { useTestMode } from '@/lib/test-mode'
import { FlaskConical, Database, Volume2, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react'

interface TestModeSettingsProps {
  className?: string
}

export default function TestModeSettings({ className = '' }: TestModeSettingsProps) {
  const { isEnabled, settings, enable, disable, updateSettings, status, indicator } = useTestMode()

  const handleToggleTestMode = () => {
    if (isEnabled) {
      const confirmDisable = window.confirm(
        'Disable test mode? This will return to normal app operation. Mock data will be preserved unless you choose to clear it.'
      )
      if (confirmDisable) {
        disable()
      }
    } else {
      enable()
    }
  }

  const handleSettingChange = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] })
  }

  const handleReset = () => {
    const confirmReset = window.confirm(
      'Reset test mode? This will clear all mock data and reset settings to defaults.'
    )
    if (confirmReset) {
      // We'll need to add this method to the service
      updateSettings({ enabled: false, mockWorkouts: true, mockTTS: true, mockSubscription: true, preserveRealData: true })
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Test Mode Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical size={20} className="text-purple-600" />
          <h3 className="font-medium text-purple-800">Test Mode</h3>
          {isEnabled && (
            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">ACTIVE</span>
          )}
        </div>
        <p className="text-sm text-purple-700 mb-3">
          Safe testing environment that prevents database writes while maintaining full app functionality.
          Perfect for development and feature testing.
        </p>
        {isEnabled && indicator && (
          <div className="text-xs text-purple-800 bg-purple-100 px-2 py-1 rounded">
            {indicator}
          </div>
        )}
      </div>

      {/* Main Test Mode Toggle */}
      <div className="flex items-center justify-between p-4 border border-purple-200 bg-purple-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-purple-800">Enable Test Mode</label>
          <p className="text-xs text-purple-600">Activate safe testing environment with mock data</p>
        </div>
        <button
          onClick={handleToggleTestMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-purple-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
              isEnabled ? 'bg-gray-900 translate-x-6' : 'bg-white translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Test Mode Configuration */}
      {isEnabled && (
        <>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-800">Mock Data Settings</h4>
            
            {/* Mock Workouts */}
            <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-600" />
                <div>
                  <span className="text-sm text-blue-800">Mock Workouts</span>
                  <p className="text-xs text-blue-600">Use test workout data instead of Supabase</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('mockWorkouts')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.mockWorkouts ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                    settings.mockWorkouts ? 'bg-gray-900 translate-x-5' : 'bg-white translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Mock TTS */}
            <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-green-600" />
                <div>
                  <span className="text-sm text-green-800">Mock TTS</span>
                  <p className="text-xs text-green-600">Use mock audio responses instead of real TTS</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('mockTTS')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.mockTTS ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                    settings.mockTTS ? 'bg-gray-900 translate-x-5' : 'bg-white translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Mock Subscription */}
            <div className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-yellow-600" />
                <div>
                  <span className="text-sm text-yellow-800">Mock Subscription</span>
                  <p className="text-xs text-yellow-600">Override subscription tier (defaults to Mastery)</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('mockSubscription')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.mockSubscription ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                    settings.mockSubscription ? 'bg-gray-900 translate-x-5' : 'bg-white translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Preserve Real Data */}
            <div className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange-600" />
                <div>
                  <span className="text-sm text-orange-800">Preserve Real Data</span>
                  <p className="text-xs text-orange-600">Keep mock data when test mode is disabled</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('preserveRealData')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.preserveRealData ? 'bg-orange-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                    settings.preserveRealData ? 'bg-gray-900 translate-x-5' : 'bg-white translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-purple-800 mb-3">Test Data Status</h4>
            <div className="space-y-2 text-sm text-purple-700">
              <div className="flex justify-between">
                <span>Mock Workouts:</span>
                <span>{status.mockDataCounts.workouts} available</span>
              </div>
              <div className="flex justify-between">
                <span>TTS Requests:</span>
                <span>{settings.mockTTS ? 'Mocked' : 'Real'}</span>
              </div>
              <div className="flex justify-between">
                <span>Subscription:</span>
                <span>{settings.mockSubscription ? 'Mastery (Test)' : 'Real'}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-400 mb-1">Important Notes</h4>
                <ul className="text-xs text-amber-300 space-y-1">
                  <li>• Test mode prevents all database writes to Supabase</li>
                  <li>• Mock data is stored locally and will persist between sessions</li>
                  <li>• Real subscription status is temporarily overridden</li>
                  <li>• Perfect for testing features without affecting production data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-gray-600">
            <button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Reset Test Mode
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This will disable test mode, clear all mock data, and reset settings to defaults.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
