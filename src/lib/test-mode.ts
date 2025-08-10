'use client'

import React from 'react'

// Test Mode Service
// Provides safe testing environment without database writes

export interface TestModeSettings {
  enabled: boolean
  mockWorkouts: boolean
  mockTTS: boolean
  mockSubscription: boolean
  preserveRealData: boolean
}

export interface MockWorkoutData {
  id: string
  date: string
  workout_type: 'Push' | 'Pull'
  exercises: Array<{
    exercise_name: string
    band_color: 'Ultra Light' | 'White' | 'Light Gray' | 'Dark Gray' | 'Black' | 'Elite'
    full_reps: number
    partial_reps: number
  }>
}

const DEFAULT_SETTINGS: TestModeSettings = {
  enabled: false,
  mockWorkouts: true,
  mockTTS: true,
  mockSubscription: true,
  preserveRealData: true
}

const TEST_MODE_KEY = 'x3-test-mode'
const TEST_WORKOUTS_KEY = 'x3-test-workouts'
const TEST_SUBSCRIPTION_KEY = 'x3-test-subscription'

class TestModeService {
  private settings: TestModeSettings = DEFAULT_SETTINGS
  private listeners: Array<(enabled: boolean) => void> = []
  private ttsQueue: Array<{ text: string; resolve: () => void; reject: (error: Error) => void }> = []
  private isCurrentlySpeaking = false
  private currentUtterance: SpeechSynthesisUtterance | null = null

  constructor() {
    this.loadSettings()
  }

  // Settings Management
  loadSettings(): TestModeSettings {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(TEST_MODE_KEY)
        if (saved) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        }
      }
    } catch (error) {
      console.warn('Failed to load test mode settings:', error)
      this.settings = DEFAULT_SETTINGS
    }
    return this.settings
  }

  saveSettings(newSettings: Partial<TestModeSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TEST_MODE_KEY, JSON.stringify(this.settings))
    }
    this.notifyListeners()
  }

  getSettings(): TestModeSettings {
    return { ...this.settings }
  }

  // Test Mode Status
  isEnabled(): boolean {
    return this.settings.enabled
  }

  enable(): void {
    this.saveSettings({ enabled: true })
    this.createMockData()
  }

  disable(): void {
    this.saveSettings({ enabled: false })
    if (!this.settings.preserveRealData) {
      this.clearMockData()
    }
  }

  // Mock Data Management
  createMockData(): void {
    this.createMockWorkouts()
    this.createMockSubscription()
  }

  createMockWorkouts(): void {
    const mockWorkouts: MockWorkoutData[] = [
      {
        id: 'test-workout-1',
        date: new Date().toISOString().split('T')[0],
        workout_type: 'Push',
        exercises: [
          { exercise_name: 'Chest Press', band_color: 'Black', full_reps: 15, partial_reps: 8 },
          { exercise_name: 'Overhead Press', band_color: 'Dark Gray', full_reps: 12, partial_reps: 5 },
          { exercise_name: 'Tricep Press', band_color: 'Dark Gray', full_reps: 18, partial_reps: 10 },
          { exercise_name: 'Calf Raise', band_color: 'Light Gray', full_reps: 25, partial_reps: 15 }
        ]
      },
      {
        id: 'test-workout-2',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        workout_type: 'Pull',
        exercises: [
          { exercise_name: 'Deadlift', band_color: 'Elite', full_reps: 10, partial_reps: 3 },
          { exercise_name: 'Bent Over Row', band_color: 'Black', full_reps: 14, partial_reps: 7 },
          { exercise_name: 'Underhand Row', band_color: 'Black', full_reps: 16, partial_reps: 8 },
          { exercise_name: 'Bicep Curl', band_color: 'Dark Gray', full_reps: 20, partial_reps: 12 }
        ]
      },
      {
        id: 'test-workout-3',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        workout_type: 'Push',
        exercises: [
          { exercise_name: 'Chest Press', band_color: 'Black', full_reps: 12, partial_reps: 6 },
          { exercise_name: 'Overhead Press', band_color: 'Dark Gray', full_reps: 10, partial_reps: 4 },
          { exercise_name: 'Tricep Press', band_color: 'Dark Gray', full_reps: 15, partial_reps: 8 },
          { exercise_name: 'Calf Raise', band_color: 'Light Gray', full_reps: 22, partial_reps: 12 }
        ]
      }
    ]
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TEST_WORKOUTS_KEY, JSON.stringify(mockWorkouts))
    }
  }

  createMockSubscription(): void {
    const mockSubscription = {
      tier: 'mastery', // Give full access in test mode
      active: true,
      testMode: true
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TEST_SUBSCRIPTION_KEY, JSON.stringify(mockSubscription))
    }
  }

  getMockWorkouts(): MockWorkoutData[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(TEST_WORKOUTS_KEY)
        return saved ? JSON.parse(saved) : []
      }
      return []
    } catch (error) {
      console.error('Failed to load mock workouts:', error)
      return []
    }
  }

  addMockWorkout(workout: Omit<MockWorkoutData, 'id'>): void {
    const workouts = this.getMockWorkouts()
    const newWorkout: MockWorkoutData = {
      ...workout,
      id: `test-workout-${Date.now()}`
    }
    workouts.unshift(newWorkout) // Add to beginning
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TEST_WORKOUTS_KEY, JSON.stringify(workouts))
    }
  }

  clearMockData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(TEST_WORKOUTS_KEY)
      localStorage.removeItem(TEST_SUBSCRIPTION_KEY)
    }
  }

  // Utility Methods
  shouldMockWorkouts(): boolean {
    return this.settings.enabled && this.settings.mockWorkouts
  }

  shouldMockTTS(): boolean {
    return this.settings.enabled && this.settings.mockTTS
  }

  shouldMockSubscription(): boolean {
    return this.settings.enabled && this.settings.mockSubscription
  }

  // Event Listeners
  onTestModeChange(callback: (enabled: boolean) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.settings.enabled))
  }

  // Integration Helpers
  interceptSupabaseInsert<T>(
    table: string, 
    data: T, 
    mockHandler?: (data: T) => void
  ): Promise<{ data: T | null; error: Error | null }> {
    if (!this.isEnabled()) {
      // Not in test mode, let normal flow continue
      return Promise.resolve({ data: null, error: new Error('Not intercepted') })
    }

    console.log(`🧪 Test Mode: Intercepted ${table} insert:`, data)
    
    if (table === 'workout_exercises' && mockHandler) {
      mockHandler(data)
    }

    // Return successful mock response
    return Promise.resolve({ 
      data: { ...data, id: `test-${Date.now()}` } as T, 
      error: null 
    })
  }

  async getMockTTSResponse(text: string): Promise<{ audio_url: string; success: boolean }> {
    console.log('🧪 Test Mode: Mock TTS for text:', text)
    
    try {
      // Actually speak the text using browser speech synthesis in test mode
      await this.speakWithBrowserTTS(text)
      
      console.log('🧪 Test Mode: TTS completed successfully')
      return {
        audio_url: `data:audio/wav;base64,mock-audio-${Date.now()}`,
        success: true
      }
    } catch (error) {
      console.error('🧪 Test Mode: TTS failed:', error)
      return {
        audio_url: `data:audio/wav;base64,mock-audio-${Date.now()}`,
        success: true // Still return success to avoid breaking the flow
      }
    }
  }

  // Speak text using browser speech synthesis with queueing (for test mode)
  private speakWithBrowserTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.warn('🔊 Test Mode: Speech synthesis not available')
        reject(new Error('Speech synthesis not available'))
        return
      }

      // Add to queue
      this.ttsQueue.push({ text, resolve, reject })
      console.log(`🔊 Test Mode: Added to TTS queue (${this.ttsQueue.length} items)`)
      
      // Process queue if not currently speaking
      this.processNextTTS()
    })
  }

  private processNextTTS(): void {
    if (this.isCurrentlySpeaking || this.ttsQueue.length === 0) {
      return
    }

    const { text, resolve, reject } = this.ttsQueue.shift()!
    this.isCurrentlySpeaking = true

    console.log(`🔊 Test Mode: Processing TTS: "${text.substring(0, 50)}..."`)

    // Cancel any existing speech to prevent conflicts
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      // Wait a bit for cancellation to complete
      setTimeout(() => this.createAndSpeakUtterance(text, resolve, reject), 100)
    } else {
      this.createAndSpeakUtterance(text, resolve, reject)
    }
  }

  private async createAndSpeakUtterance(text: string, resolve: () => void, reject: (error: Error) => void): Promise<void> {
    // Request audio permission if needed
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        console.log('🔒 Audio permission status:', permission.state)
      } catch {
        // Permissions API not available or microphone permission not applicable
        console.log('🔒 Audio permissions check not available')
      }
    }

    // Ensure voices are loaded
    await this.ensureVoicesLoaded()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    // Store current utterance for cancellation tracking
    this.currentUtterance = utterance
    
    // Try to use a good voice
    const voices = window.speechSynthesis.getVoices()
    console.log(`🔊 Available voices: ${voices.length}`)
    
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria') || voice.name.includes('Microsoft'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0]
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
      console.log('🔊 Test Mode: Using voice:', preferredVoice.name)
    }
    
    let hasEnded = false
    
    utterance.onstart = () => {
      console.log('🔊 Test Mode: TTS started successfully')
    }
    
    utterance.onend = () => {
      if (!hasEnded) {
        hasEnded = true
        console.log('🔊 Test Mode: TTS completed successfully')
        this.isCurrentlySpeaking = false
        this.currentUtterance = null
        resolve()
        
        // Process next item in queue
        setTimeout(() => this.processNextTTS(), 100)
      }
    }
    
    utterance.onerror = (event) => {
      if (!hasEnded) {
        hasEnded = true
        console.error('🔊 Test Mode: TTS error:', event.error)
        this.isCurrentlySpeaking = false
        this.currentUtterance = null
        
        // Don't fail completely on interrupted errors, just continue
        if (event.error === 'interrupted') {
          console.log('🔊 Test Mode: TTS was interrupted, continuing...')
          resolve() // Resolve instead of reject for interrupted
        } else {
          reject(new Error(`TTS error: ${event.error}`))
        }
        
        // Process next item in queue
        setTimeout(() => this.processNextTTS(), 100)
      }
    }
    
    // Handle browser-specific timing issues
    setTimeout(() => {
      try {
        console.log('🔊 Test Mode: Starting speech synthesis...')
        window.speechSynthesis.speak(utterance)
        
        // Safety timeout to prevent hanging
        setTimeout(() => {
          if (!hasEnded && this.currentUtterance === utterance) {
            console.warn('🔊 Test Mode: TTS timeout, forcing completion')
            hasEnded = true
            this.isCurrentlySpeaking = false
            this.currentUtterance = null
            resolve()
            setTimeout(() => this.processNextTTS(), 100)
          }
        }, 10000) // 10 second timeout
        
      } catch (error) {
        console.error('🔊 Test Mode: Error starting TTS:', error)
        if (!hasEnded) {
          hasEnded = true
          this.isCurrentlySpeaking = false
          this.currentUtterance = null
          reject(error instanceof Error ? error : new Error('Unknown TTS error'))
          setTimeout(() => this.processNextTTS(), 100)
        }
      }
    }, 50)
  }

  // Ensure voices are loaded before attempting speech
  private ensureVoicesLoaded(): Promise<void> {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        resolve()
        return
      }

      // Wait for voices to load
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
          resolve()
        }
      }

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
      
      // Fallback timeout
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
        resolve()
      }, 2000)
    })
  }

  // Stop all TTS and clear queue
  public stopAllTTS(): void {
    console.log('🔊 Test Mode: Stopping all TTS')
    
    // Clear queue
    this.ttsQueue.forEach(item => item.resolve())
    this.ttsQueue = []
    
    // Cancel current speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    
    this.isCurrentlySpeaking = false
    this.currentUtterance = null
  }

  getTestModeIndicator(): string {
    if (!this.isEnabled()) return ''
    
    const indicators = []
    if (this.settings.mockWorkouts) indicators.push('Workouts')
    if (this.settings.mockTTS) indicators.push('TTS (Browser Speech)')
    if (this.settings.mockSubscription) indicators.push('Subscription')
    
    return `🧪 TEST MODE: ${indicators.join(', ')}`
  }

  // Reset and Cleanup
  reset(): void {
    this.clearMockData()
    this.saveSettings(DEFAULT_SETTINGS)
  }

  getStatus(): {
    enabled: boolean
    settings: TestModeSettings
    mockDataCounts: {
      workouts: number
    }
  } {
    return {
      enabled: this.isEnabled(),
      settings: this.getSettings(),
      mockDataCounts: {
        workouts: this.getMockWorkouts().length
      }
    }
  }
}

// Singleton instance
export const testModeService = new TestModeService()

// React Hook for Test Mode
export function useTestMode() {
  const [isEnabled, setIsEnabled] = React.useState(testModeService.isEnabled())
  const [settings, setSettings] = React.useState(testModeService.getSettings())

  React.useEffect(() => {
    const unsubscribe = testModeService.onTestModeChange((enabled) => {
      setIsEnabled(enabled)
      setSettings(testModeService.getSettings())
    })

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  const enable = () => testModeService.enable()
  const disable = () => testModeService.disable()
  const updateSettings = (newSettings: Partial<TestModeSettings>) => {
    testModeService.saveSettings(newSettings)
  }

  return {
    isEnabled,
    settings,
    enable,
    disable,
    updateSettings,
    status: testModeService.getStatus(),
    indicator: testModeService.getTestModeIndicator()
  }
}

// React is imported at the top of the file
