'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Lightbulb,
  TrendingUp,
  Heart,
  BookOpen
} from 'lucide-react'
import { useX3TTS } from '@/hooks/useX3TTS'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { coachingService } from '@/lib/coaching-service'
import { supabase } from '@/lib/supabase'

interface CoachingMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  tone?: 'supportive' | 'motivational' | 'educational' | 'celebratory'
  suggestions?: string[]
  confidence?: number
}

interface AICoachingProps {
  workoutData?: any[]
  className?: string
}

export default function AICoaching({ workoutData = [], className = '' }: AICoachingProps) {
  const { tier, hasFeature } = useSubscription()
  const { speak, settings, isTTSAvailable } = useX3TTS()
  const [messages, setMessages] = useState<CoachingMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [announcement, setAnnouncement] = useState('')

  const isAICoachingAvailable = hasFeature('aiCoachAccess')

  // Add welcome message for Mastery users
  useEffect(() => {
    if (isAICoachingAvailable && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: "Hi! I'm your AI coach. I can analyze your workouts, provide personalized feedback, and help you optimize your X3 training. What would you like to discuss?",
        timestamp: new Date(),
        tone: 'supportive',
        confidence: 0.9
      }])
    }
  }, [isAICoachingAvailable, messages.length])

  // Announce new AI messages to screen readers
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.type === 'ai' && lastMessage.id !== 'welcome') {
        // Create a brief announcement for screen readers
        const preview = lastMessage.content.length > 100 
          ? lastMessage.content.substring(0, 100) + '...'
          : lastMessage.content
        setAnnouncement(`Coach responded: ${preview}`)
        
        // Clear announcement after a short delay
        setTimeout(() => setAnnouncement(''), 1000)
      }
    }
  }, [messages])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !isAICoachingAvailable) return

    const userMessage: CoachingMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get user's recent workout history for context
      const { data: recentWorkouts } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_local_date_time', { ascending: false })
        .limit(10)

      // Determine coaching type based on tier
      const coachingType = tier === 'mastery' ? 'dynamic' : 'static'

      const response = await coachingService.getCoachingResponse({
        user_id: user.id,
        user_feedback: content.trim(),
        workout_data: workoutData.length > 0 ? workoutData : recentWorkouts || [],
        progress_history: recentWorkouts || [],
        coaching_type: coachingType
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to get coaching response')
      }

      const aiMessage: CoachingMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
        tone: response.tone,
        suggestions: response.suggestions,
        confidence: response.confidence
      }

      setMessages(prev => [...prev, aiMessage])

      // Speak the TTS message if available
      if (isTTSAvailable && settings.enabled && response.tts_message) {
        await speak(response.tts_message)
      }

    } catch (error) {
      console.error('Coaching request failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to get coaching response')
      
      // Add error message
      const errorMessage: CoachingMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        tone: 'supportive',
        confidence: 0.5
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [isAICoachingAvailable, tier, workoutData, speak, isTTSAvailable, settings.enabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoading && inputValue.trim()) {
      sendMessage(inputValue)
    }
  }

  const getToneIcon = (tone?: string) => {
    switch (tone) {
      case 'motivational':
        return <TrendingUp size={16} className="text-orange-600" />
      case 'educational':
        return <BookOpen size={16} className="text-blue-600" />
      case 'celebratory':
        return <Sparkles size={16} className="text-yellow-600" />
      case 'supportive':
      default:
        return <Heart size={16} className="text-green-600" />
    }
  }

  const getToneColor = (tone?: string) => {
    switch (tone) {
      case 'motivational':
        return 'border-orange-200 bg-orange-50'
      case 'educational':
        return 'border-blue-200 bg-blue-50'
      case 'celebratory':
        return 'border-yellow-200 bg-yellow-50'
      case 'supportive':
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  if (!isAICoachingAvailable) {
    return (
      <div className={`brand-card ${className}`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h3 className="text-subhead mb-2">AI Coaching</h3>
          <p className="text-secondary mb-4">
            Upgrade to Momentum or Mastery tier to access personalized AI coaching and workout analysis.
          </p>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500">
              AI coaching features:
            </div>
            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              <li>• Personalized workout feedback</li>
              <li>• Progress analysis and recommendations</li>
              <li>• Form and technique guidance</li>
              <li>• Motivation and goal setting</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section 
      role="region" 
      aria-label="AI Coach Chat Interface"
      className={`brand-card ${className}`}
    >
      {/* Screen Reader Announcements */}
      <div aria-live="assertive" className="sr-only">
        {announcement}
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles size={20} className="text-orange-600" />
          <h3 className="text-subhead">AI Coach</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isTTSAvailable && (
            <button
              onClick={() => {
                if (settings.enabled) {
                  speak("AI coaching audio enabled.")
                } else {
                  speak("AI coaching audio disabled.")
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (settings.enabled) {
                    speak("AI coaching audio enabled.")
                  } else {
                    speak("AI coaching audio disabled.")
                  }
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                settings.enabled 
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={settings.enabled ? 'Audio enabled' : 'Audio disabled'}
              aria-label={`TTS audio ${settings.enabled ? 'enabled' : 'disabled'}. Press to test audio.`}
            >
              {settings.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 uppercase">
            {tier}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div 
        role="log" 
        aria-live="polite" 
        aria-label="Coach conversation history"
        className="h-96 overflow-y-auto mb-4 space-y-3"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-orange-500 text-white'
                  : `border ${getToneColor(message.tone)}`
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && message.tone && (
                  <div className="flex-shrink-0 mt-0.5">
                    {getToneIcon(message.tone)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  {message.type === 'ai' && message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-1 mb-2">
                        <Lightbulb size={12} className="text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">Suggestions:</span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-orange-500">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {message.type === 'ai' && message.confidence && (
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {Math.round(message.confidence * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin text-orange-600" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2" role="form" aria-label="Send message to AI coach">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask your AI coach anything..."
          disabled={isLoading}
          aria-label="Message input field"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          <span>Send</span>
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Quick prompts:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "How am I progressing?",
            "Form tips for push-ups",
            "When should I increase resistance?",
            "Motivation for today"
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInputValue(prompt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setInputValue(prompt)
                }
              }}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              aria-label={`Use quick prompt: ${prompt}`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
} 