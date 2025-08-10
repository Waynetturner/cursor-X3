'use client'

import { useState } from 'react'
import { Volume2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { backendService } from '@/lib/backend-integration'
import { supabase } from '@/lib/supabase'

export default function SimpleTTSTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean
    message: string
    timestamp: string
  } | null>(null)

  const testTTS = async () => {
    setIsLoading(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLastTestResult({
          success: false,
          message: 'No authenticated user found',
          timestamp: new Date().toLocaleTimeString()
        })
        return
      }

      // Test TTS with a simple message
      const result = await backendService.generateSpeech(
        'Testing TTS functionality from Advanced Settings',
        user.id,
        'ash', // Default voice
        1.0,   // Normal speed
        'test' // Test context
      )

      if (result.success && result.audioContent) {
        // Play the audio to verify it works
        const audio = new Audio(`data:audio/mp3;base64,${result.audioContent}`)
        await audio.play()
        
        setLastTestResult({
          success: true,
          message: `TTS test successful! Voice: ${result.voice || 'ash'}, Provider: ${result.provider || 'OpenAI.fm'}`,
          timestamp: new Date().toLocaleTimeString()
        })
      } else {
        setLastTestResult({
          success: false,
          message: result.error || 'TTS test failed - no audio generated',
          timestamp: new Date().toLocaleTimeString()
        })
      }
    } catch (error) {
      console.error('TTS test failed:', error)
      setLastTestResult({
        success: false,
        message: `TTS test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Volume2 size={20} className="text-orange-400" />
        <h3 className="font-medium text-gray-800">TTS Functionality Test</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Test your Text-to-Speech setup to ensure it&apos;s working properly for cadence buttons and workout audio cues.
      </p>

      <button
        onClick={testTTS}
        disabled={isLoading}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Testing TTS...
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            Test TTS Audio
          </>
        )}
      </button>

      {lastTestResult && (
        <div className={`p-4 rounded-lg border ${
          lastTestResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {lastTestResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              lastTestResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastTestResult.success ? 'TTS Test Passed' : 'TTS Test Failed'}
            </span>
            <span className="text-xs text-gray-500 ml-auto">
              {lastTestResult.timestamp}
            </span>
          </div>
          <p className={`text-sm ${
            lastTestResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {lastTestResult.message}
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">What This Tests</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Authentication with Supabase</li>
          <li>• Edge Function connectivity</li>
          <li>• OpenAI.fm TTS integration</li>
          <li>• Audio playback in browser</li>
        </ul>
      </div>
    </div>
  )
}
