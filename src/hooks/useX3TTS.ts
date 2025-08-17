'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { backendService } from '@/lib/backend-integration'
import { supabase } from '@/lib/supabase'
import { testModeService } from '@/lib/test-mode'

export interface TTSVoice {
  id: string
  name: string
  gender: 'male' | 'female'
  language: string
}

export interface TTSSettings {
  enabled: boolean
  voice: string
  speed: number
  volume: number
}

export type TTSSource = 'openai' | 'webspeech' | 'browser' | 'mock' | 'none'
export type TTSContext = 'exercise' | 'countdown' | 'rest' | 'general' | 'coach'

export interface TTSAudio {
  id: string
  text: string
  audioUrl?: string
  isPlaying: boolean
  error?: string
}

const DEFAULT_VOICES: TTSVoice[] = [
  { id: 'ash', name: 'Ash (Premium Dynamic)', gender: 'female', language: 'en-US' },
  { id: 'nova', name: 'Nova (Female)', gender: 'female', language: 'en-US' },
  { id: 'alloy', name: 'Alloy (Neutral)', gender: 'female', language: 'en-US' },
  { id: 'echo', name: 'Echo (Male)', gender: 'male', language: 'en-US' },
  { id: 'fable', name: 'Fable (Male)', gender: 'male', language: 'en-US' },
  { id: 'onyx', name: 'Onyx (Male)', gender: 'male', language: 'en-US' },
  { id: 'shimmer', name: 'Shimmer (Female)', gender: 'female', language: 'en-US' },
]

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: true,
  voice: 'ash', // Use Ash as default (premium dynamic voice with instructions)
  speed: 1.0,
  volume: 0.8,
}

export function useX3TTS() {
  const { tier, hasFeature } = useSubscription()
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS)
  const [audioQueue, setAudioQueue] = useState<TTSAudio[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSource, setCurrentSource] = useState<TTSSource>('none')
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioId = useRef<string | null>(null)

  // Load settings from user preferences
  useEffect(() => {
    loadTTSSettings()
  }, [])

  // Handle Web Speech API voice loading
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          setVoicesLoaded(true)
          console.log('🔊 Speech synthesis voices loaded:', voices.length)
        }
      }

      // Check if voices are already loaded
      handleVoicesChanged()

      // Listen for voices to be loaded
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
    }
  }, [])

  // Check if TTS is available for current tier
  const isTTSAvailable = hasFeature('ttsAudioCues')

  const loadTTSSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_ui_settings')
        .select('tts_enabled, tts_voice, tts_speed, tts_volume')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading TTS settings:', error)
        return
      }

      if (data) {
        setSettings({
          enabled: data.tts_enabled ?? DEFAULT_SETTINGS.enabled,
          voice: data.tts_voice ?? DEFAULT_SETTINGS.voice,
          speed: data.tts_speed ?? DEFAULT_SETTINGS.speed,
          volume: data.tts_volume ?? DEFAULT_SETTINGS.volume,
        })
      }
    } catch (error) {
      console.error('Failed to load TTS settings:', error)
    }
  }

  const saveTTSSettings = async (newSettings: TTSSettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_ui_settings')
        .upsert({
          user_id: user.id,
          tts_enabled: newSettings.enabled,
          tts_voice: newSettings.voice,
          tts_speed: newSettings.speed,
          tts_volume: newSettings.volume,
        })

      if (error) {
        console.error('Error saving TTS settings:', error)
        return false
      }

      setSettings(newSettings)
      return true
    } catch (error) {
      console.error('Failed to save TTS settings:', error)
      return false
    }
  }

  const generateSpeech = useCallback(async (text: string, context: TTSContext = 'general'): Promise<TTSAudio | null> => {
    if (!isTTSAvailable || !settings.enabled) {
      setCurrentSource('none')
      return null
    }

    setIsLoading(true)
    setError(null)

    const audioId = `tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      // Check test mode first
      if (testModeService.shouldMockTTS()) {
        console.log('🧪 Test Mode: Using mock TTS')
        setCurrentSource('mock')
        const mockResult = await testModeService.getMockTTSResponse(text)
        
        const audio: TTSAudio = {
          id: audioId,
          text,
          audioUrl: mockResult.audio_url,
          isPlaying: false,
        }

        setAudioQueue(prev => [...prev, audio])
        return audio
      }

      // Fallback hierarchy: OpenAI → Web Speech API → Browser TTS
      
      // 1. Try OpenAI TTS (for all tiers - better voice quality)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          console.log(`🤖 Attempting OpenAI.fm TTS with '${settings.voice}' voice for context: ${context}`)
          const result = await backendService.generateSpeech(
            text,
            user.id,
            settings.voice,
            settings.speed,
            context
          )

          if (result && result.audioContent) {
            console.log('✅ OpenAI TTS successful - got base64 audio content')
            setCurrentSource('openai')
            
            // Convert base64 to blob URL
            try {
              const audioBytes = atob(result.audioContent)
              const audioArray = new Uint8Array(audioBytes.length)
              for (let i = 0; i < audioBytes.length; i++) {
                audioArray[i] = audioBytes.charCodeAt(i)
              }
              
              const audioBlob = new Blob([audioArray], { type: 'audio/mp3' })
              const audioUrl = URL.createObjectURL(audioBlob)
              
              const audio: TTSAudio = {
                id: audioId,
                text,
                audioUrl: audioUrl,
                isPlaying: false,
              }

              setAudioQueue(prev => [...prev, audio])
              return audio
            } catch (conversionError) {
              console.error('❌ Failed to convert base64 to audio:', conversionError)
            }
          } else {
            console.warn('⚠️ OpenAI TTS failed. Full response:', result)
            console.warn('⚠️ Error details:', result?.error || 'No audioContent in response')
          }
        }
      } catch (openAIError) {
        console.warn('⚠️ OpenAI TTS failed, trying Web Speech API:', openAIError)
      }

      // 2. Try Web Speech API
      if ('speechSynthesis' in window) {
        try {
          console.log('🔊 Attempting Web Speech API')
          setCurrentSource('webspeech')
          
          const audio: TTSAudio = {
            id: audioId,
            text,
            isPlaying: false,
            // No audioUrl for Web Speech API - we'll handle it differently
          }

          setAudioQueue(prev => [...prev, audio])
          return audio
        } catch (webSpeechError) {
          console.warn('⚠️ Web Speech API failed, falling back to browser TTS:', webSpeechError)
        }
      }

      // 3. Fallback to browser TTS (if available)
      console.log('📱 Falling back to browser TTS')
      setCurrentSource('browser')
      
      const audio: TTSAudio = {
        id: audioId,
        text,
        isPlaying: false,
        // No audioUrl for browser TTS
      }

      setAudioQueue(prev => [...prev, audio])
      return audio

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      console.error('All TTS methods failed:', error)
      setCurrentSource('none')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isTTSAvailable, settings, tier, backendService])

  const playAudio = useCallback(async (audio: TTSAudio) => {
    try {
      // Stop current audio if playing
      if (audioRef.current && currentAudioId.current) {
        audioRef.current.pause()
        audioRef.current = null
        currentAudioId.current = null
      }

      // Stop any existing speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }

      setAudioQueue(prev => prev.map(item => 
        item.id === audio.id ? { ...item, isPlaying: true } : item
      ))

      currentAudioId.current = audio.id

      // Handle different TTS sources
      if (audio.audioUrl) {
        // Check if this is a mock audio URL (test mode)
        if (audio.audioUrl.startsWith('data:audio/wav;base64,mock-audio-')) {
          console.log('🧪 Test Mode: Mock audio URL detected, skipping audio element playback')
          // For mock audio, just mark as completed since actual TTS already happened
          setTimeout(() => {
            setAudioQueue(prev => prev.map(item => 
              item.id === audio.id ? { ...item, isPlaying: false } : item
            ))
            currentAudioId.current = null
          }, 100)
          return
        }
        
        // Real OpenAI TTS with audio URL
        const audioElement = new Audio(audio.audioUrl)
        audioElement.volume = settings.volume
        
        audioElement.addEventListener('ended', () => {
          setAudioQueue(prev => prev.map(item => 
            item.id === audio.id ? { ...item, isPlaying: false } : item
          ))
          currentAudioId.current = null
          audioRef.current = null
        })

        audioElement.addEventListener('error', () => {
          setAudioQueue(prev => prev.map(item => 
            item.id === audio.id ? { ...item, isPlaying: false, error: 'Audio playback failed' } : item
          ))
          currentAudioId.current = null
          audioRef.current = null
        })

        audioRef.current = audioElement
        await audioElement.play()
      } else {
        // Web Speech API or Browser TTS
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(audio.text)
          utterance.rate = settings.speed
          utterance.volume = settings.volume
          
          // Try to use a higher quality voice if available (only if voices are loaded)
          if (voicesLoaded) {
            const voices = window.speechSynthesis.getVoices()
            const preferredVoice = voices.find(voice => 
              voice.name.includes('Google') || 
              voice.name.includes('Microsoft') ||
              voice.name.includes(settings.voice.split('-')[0])
            )
            
            if (preferredVoice) {
              utterance.voice = preferredVoice
              console.log(`🔊 Using voice: ${preferredVoice.name}`)
            } else {
              console.log('🔊 Using default system voice')
            }
          } else {
            console.log('🔊 Voices not yet loaded, using default voice')
          }

          utterance.addEventListener('end', () => {
            setAudioQueue(prev => prev.map(item => 
              item.id === audio.id ? { ...item, isPlaying: false } : item
            ))
            currentAudioId.current = null
          })

          utterance.addEventListener('error', (event) => {
            console.error('Speech synthesis error:', event)
            setAudioQueue(prev => prev.map(item => 
              item.id === audio.id ? { ...item, isPlaying: false, error: 'Speech synthesis failed' } : item
            ))
            currentAudioId.current = null
          })

          window.speechSynthesis.speak(utterance)
        } else {
          throw new Error('Speech synthesis not supported')
        }
      }
    } catch (error) {
      console.error('Audio playback failed:', error)
      setAudioQueue(prev => prev.map(item => 
        item.id === audio.id ? { ...item, isPlaying: false, error: 'Audio playback failed' } : item
      ))
      currentAudioId.current = null
    }
  }, [settings.volume, settings.speed, settings.voice, voicesLoaded])

  const stopAudio = useCallback(() => {
    // Stop HTML5 audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    if (currentAudioId.current) {
      setAudioQueue(prev => prev.map(item => 
        item.id === currentAudioId.current ? { ...item, isPlaying: false } : item
      ))
      currentAudioId.current = null
    }
  }, [])

  const speak = useCallback(async (text: string, context: TTSContext = 'general') => {
    if (!isTTSAvailable || !settings.enabled) {
      return
    }

    const audio = await generateSpeech(text, context)
    if (audio) {
      await playAudio(audio)
    }
  }, [isTTSAvailable, settings.enabled, generateSpeech, playAudio])

  const clearQueue = useCallback(() => {
    stopAudio()
    setAudioQueue([])
  }, [stopAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  return {
    // State
    settings,
    audioQueue,
    isLoading,
    error,
    isTTSAvailable,
    currentSource,
    
    // Actions
    speak,
    generateSpeech,
    playAudio,
    stopAudio,
    clearQueue,
    saveTTSSettings,
    
    // Utilities
    voices: DEFAULT_VOICES,
    tier,
    
    // Source indicator helper
    getSourceIndicator: () => {
      switch (currentSource) {
        case 'openai': return '🎤 OpenAI.fm TTS'
        case 'webspeech': return '🔊 Web Speech API'
        case 'browser': return '📱 Browser TTS'
        case 'mock': return '🧪 Test Mode'
        case 'none': return '🔇 No Audio'
        default: return '❓ Unknown'
      }
    }
  }
} 