'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { backendService } from '@/lib/backend-integration'
import { supabase } from '@/lib/supabase'

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

export interface TTSAudio {
  id: string
  text: string
  audioUrl?: string
  isPlaying: boolean
  error?: string
}

const DEFAULT_VOICES: TTSVoice[] = [
  { id: 'en-US-Neural2-F', name: 'Sarah (Female)', gender: 'female', language: 'en-US' },
  { id: 'en-US-Neural2-M', name: 'Michael (Male)', gender: 'male', language: 'en-US' },
  { id: 'en-US-Neural2-C', name: 'Emma (Female)', gender: 'female', language: 'en-US' },
  { id: 'en-US-Neural2-D', name: 'David (Male)', gender: 'male', language: 'en-US' },
]

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: true,
  voice: 'en-US-Neural2-F',
  speed: 1.0,
  volume: 0.8,
}

export function useX3TTS() {
  const { tier, hasFeature } = useSubscription()
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS)
  const [audioQueue, setAudioQueue] = useState<TTSAudio[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioId = useRef<string | null>(null)

  // Load settings from user preferences
  useEffect(() => {
    loadTTSSettings()
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

  const generateSpeech = useCallback(async (text: string): Promise<TTSAudio | null> => {
    if (!isTTSAvailable || !settings.enabled) {
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const result = await backendService.generateSpeech(
        text,
        user.id,
        settings.voice,
        settings.speed
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate speech')
      }

      const audioId = `tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const audio: TTSAudio = {
        id: audioId,
        text,
        audioUrl: result.audio_url,
        isPlaying: false,
      }

      setAudioQueue(prev => [...prev, audio])
      return audio
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      console.error('TTS generation failed:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isTTSAvailable, settings, backendService])

  const playAudio = useCallback(async (audio: TTSAudio) => {
    if (!audio.audioUrl) return

    try {
      // Stop current audio if playing
      if (audioRef.current && currentAudioId.current) {
        audioRef.current.pause()
        audioRef.current = null
        currentAudioId.current = null
      }

      // Create new audio element
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
      currentAudioId.current = audio.id

      setAudioQueue(prev => prev.map(item => 
        item.id === audio.id ? { ...item, isPlaying: true } : item
      ))

      await audioElement.play()
    } catch (error) {
      console.error('Audio playback failed:', error)
      setAudioQueue(prev => prev.map(item => 
        item.id === audio.id ? { ...item, isPlaying: false, error: 'Audio playback failed' } : item
      ))
    }
  }, [settings.volume])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    if (currentAudioId.current) {
      setAudioQueue(prev => prev.map(item => 
        item.id === currentAudioId.current ? { ...item, isPlaying: false } : item
      ))
      currentAudioId.current = null
    }
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!isTTSAvailable || !settings.enabled) {
      return
    }

    const audio = await generateSpeech(text)
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
  }
} 