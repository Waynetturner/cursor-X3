'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, Volume2, VolumeX, Loader2, Bot, User, Minimize2, Maximize2, Brain } from 'lucide-react'
import { useX3TTS } from '@/hooks/useX3TTS'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { testModeService } from '@/lib/test-mode'
import { useWebLLMCoach } from '@/hooks/useWebLLMCoach'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
  id: string
  role: 'user' | 'coach'
  content: string
  timestamp: Date
  ttsPlayed?: boolean
}

interface CoachChatProps {
  currentExercise?: {
    name: string
    band: string
    fullReps: number
    partialReps: number
    notes: string
  }
  workoutContext?: {
    workoutType: 'Push' | 'Pull' | 'Rest'
    week: number
    exercisesCompleted: number
    totalExercises: number
  }
}

const COACH_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://172.232.25.45:5678/webhook/874fcd0b-8a3c-4ccd-8488-4cab10b24d7d'

export default function CoachChat({ currentExercise, workoutContext }: CoachChatProps) {
  // State management
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoTTS, setAutoTTS] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Hooks
  const { hasFeature } = useSubscription()
  const { speak, isLoading: ttsLoading } = useX3TTS()
  
  // WebLLM Coach Hook
  const webLLMCoach = useWebLLMCoach({ 
    userId: user?.id,
    modelId: "Llama-3.1-8B-Instruct-q4f32_1-MLC"
  })
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if user has access to coach chat
  const hasCoachAccess = hasFeature('aiCoachAccess')

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && hasCoachAccess) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'coach',
        content: "Hey there! I'm your AI coach. I'm here to help you optimize your X3 workouts, provide form tips, and keep you motivated. What can I help you with today?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      
      // Auto-play welcome message with TTS
      if (autoTTS && hasFeature('ttsAudioCues')) {
        setTimeout(() => {
          speak(welcomeMessage.content, 'coach')
        }, 500)
      }
    }
  }, [isOpen, hasCoachAccess, autoTTS, hasFeature, speak, messages.length])

  // Send message using WebLLM or fallback to n8n webhook
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    try {
      let response: { message: string; success: boolean; error?: string }

      // Update WebLLM context if available
      if (webLLMCoach.isReady && currentExercise && workoutContext) {
        webLLMCoach.updateWorkoutContext({
          currentExercise,
          workoutContext
        })
      }

      // Check if in test mode
      if (testModeService.shouldMockWorkouts()) {
        console.log('🧪 Test Mode: Mock coach response')
        response = {
          message: `Thanks for your question: "${content}". Here's some personalized advice based on your current ${workoutContext?.workoutType || 'workout'} session. ${currentExercise ? `For ${currentExercise.name} with ${currentExercise.band} band, focus on controlled movements and proper form. Your ${currentExercise.fullReps} full reps and ${currentExercise.partialReps} partial reps show good progression!` : 'Keep pushing towards your goals!'} Remember, consistency beats intensity every time.`,
          success: true
        }
      }
      // Try WebLLM first if available
      else if (webLLMCoach.isReady && webLLMCoach.canGenerate) {
        console.log('🧠 Using WebLLM coach for response')
        try {
          const llmResponse = await webLLMCoach.generateResponse(content.trim(), {
            currentExercise,
            workoutContext
          })
          
          response = {
            message: llmResponse,
            success: true
          }
        } catch (llmError) {
          console.warn('🧠 WebLLM failed, falling back to n8n:', llmError)
          throw llmError // Will trigger fallback below
        }
      }
      // Fallback to n8n webhook
      else {
        console.log('📡 Using n8n webhook for response (WebLLM not ready)')
        
        // Prepare context for the coach
        const contextData = {
          message: content.trim(),
          currentExercise,
          workoutContext,
          timestamp: new Date().toISOString(),
          userId: user?.id || 'anonymous',
          subscription: hasFeature('ttsAudioCues') ? 'mastery' : hasFeature('restTimer') ? 'momentum' : 'foundation'
        }

        // Make request to n8n webhook
        const webhookResponse = await fetch(COACH_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contextData)
        })

        if (!webhookResponse.ok) {
          throw new Error(`Webhook failed: ${webhookResponse.status}`)
        }

        const responseText = await webhookResponse.text()
        
        // Handle empty or invalid JSON responses
        if (!responseText.trim()) {
          console.log('📋 Empty response from n8n webhook, using fallback')
          response = {
            message: `Thanks for your question about ${currentExercise?.name || 'your workout'}! While I'm processing your request, here's some quick advice: Focus on controlled movements and proper form. ${currentExercise ? `For ${currentExercise.name} with ${currentExercise.band} band, ensure you're maintaining tension throughout the full range of motion.` : ''} Keep up the great work!`,
            success: true
          }
        } else {
          try {
            response = JSON.parse(responseText)
          } catch (parseError) {
            console.log('📋 Invalid JSON from n8n webhook, using fallback')
            response = {
              message: `I received your question about your workout! Based on your current progress in week ${workoutContext?.week || 1} of your ${workoutContext?.workoutType || 'workout'} routine, you're doing great. ${currentExercise ? `For ${currentExercise.name}, focus on form over speed and make sure you're training to failure on those partial reps.` : 'Keep pushing towards your goals!'} Feel free to ask me anything else!`,
              success: true
            }
          }
        }
      }

      if (response.success && response.message) {
        // Add coach response
        const coachMessage: ChatMessage = {
          id: `coach-${Date.now()}`,
          role: 'coach',
          content: response.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, coachMessage])

        // Auto-play coach response with TTS
        if (autoTTS && hasFeature('ttsAudioCues')) {
          setTimeout(() => {
            speak(response.message, 'coach')
          }, 300)
        }
      } else {
        throw new Error(response.error || 'Failed to get coach response')
      }

    } catch (error) {
      console.error('Coach chat error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'coach',
        content: "I'm having trouble connecting right now. Please try again in a moment. In the meantime, focus on your form and remember to train to failure, not to a number!",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  // Handle TTS for existing messages
  const playMessageTTS = async (message: ChatMessage) => {
    if (message.role === 'coach' && hasFeature('ttsAudioCues')) {
      await speak(message.content, 'coach')
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, ttsPlayed: true } : msg
        )
      )
    }
  }

  // Render upgrade prompt for users without access
  if (!hasCoachAccess) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-400 hover:bg-gray-500 text-white p-3 rounded-full shadow-lg transition-all duration-200 cursor-not-allowed"
          disabled
        >
          <MessageCircle size={24} />
        </button>
        
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="text-center">
              <Bot className="mx-auto mb-3 text-gray-400" size={40} />
              <h3 className="font-semibold text-gray-900 mb-2">AI Coach Available</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upgrade to Momentum or Mastery tier to access personalized AI coaching with workout analysis and motivation.
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Upgrade for AI Coach
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-200 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-96'
        }`}>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="text-orange-600" size={20} />
              <h3 className="font-semibold text-gray-900">AI Coach</h3>
              
              {/* WebLLM Status Indicator */}
              {webLLMCoach.isReady ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center space-x-1">
                  <Brain size={12} />
                  <span>Local AI</span>
                </span>
              ) : webLLMCoach.isInitializing ? (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center space-x-1">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Loading AI</span>
                </span>
              ) : (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Cloud AI
                </span>
              )}
              
              {hasFeature('ttsAudioCues') && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  🔊 Voice
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* TTS Toggle */}
              {hasFeature('ttsAudioCues') && (
                <button
                  onClick={() => setAutoTTS(!autoTTS)}
                  className={`p-1 rounded transition-colors ${
                    autoTTS ? 'text-orange-600 hover:text-orange-700' : 'text-gray-400 hover:text-gray-500'
                  }`}
                  title={autoTTS ? 'Disable auto voice' : 'Enable auto voice'}
                >
                  {autoTTS ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              )}
              
              {/* Minimize/Maximize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-64">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'coach' && (
                          <Bot size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                        )}
                        {message.role === 'user' && (
                          <User size={16} className="text-white mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${
                              message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {message.role === 'coach' && hasFeature('ttsAudioCues') && (
                              <button
                                onClick={() => playMessageTTS(message)}
                                className="text-orange-600 hover:text-orange-700 ml-2"
                                disabled={ttsLoading}
                                title="Play with voice"
                              >
                                {ttsLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Volume2 size={12} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-3 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot size={16} className="text-orange-600" />
                        <div className="flex items-center space-x-1">
                          <Loader2 size={14} className="animate-spin text-orange-600" />
                          <span className="text-sm text-gray-600">Coach is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Error Display */}
              {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                  <p className="text-sm text-red-700">⚠️ {error}</p>
                </div>
              )}

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask your coach anything..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
                
                {/* Character count */}
                <div className="mt-1 text-right">
                  <span className="text-xs text-gray-500">
                    {inputMessage.length}/500
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
