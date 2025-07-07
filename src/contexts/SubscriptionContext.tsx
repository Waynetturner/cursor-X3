'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export type SubscriptionTier = 'foundation' | 'momentum' | 'mastery'

interface SubscriptionFeatures {
  maxWorkoutHistory: number
  aiCoachAccess: boolean
  advancedAnalytics: boolean
  customGoals: boolean
  exportData: boolean
  prioritySupport: boolean
  measurementTracking: boolean
  progressPhotos: boolean
  socialFeatures: boolean
  apiAccess: boolean
  restTimer: boolean
  ttsAudioCues: boolean
}

interface SubscriptionContextType {
  tier: SubscriptionTier
  features: SubscriptionFeatures
  isLoading: boolean
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean
  upgradeTo: (newTier: SubscriptionTier) => void
}

const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  foundation: {
    maxWorkoutHistory: 30,
    aiCoachAccess: false,
    advancedAnalytics: false,
    customGoals: false,
    exportData: false,
    prioritySupport: false,
    measurementTracking: false,
    progressPhotos: false,
    socialFeatures: false,
    apiAccess: false,
    restTimer: false,
    ttsAudioCues: false
  },
  momentum: {
    maxWorkoutHistory: 365,
    aiCoachAccess: true,
    advancedAnalytics: true,
    customGoals: true,
    exportData: true,
    prioritySupport: false,
    measurementTracking: true,
    progressPhotos: true,
    socialFeatures: false,
    apiAccess: false,
    restTimer: true,
    ttsAudioCues: true
  },
  mastery: {
    maxWorkoutHistory: -1, // unlimited
    aiCoachAccess: true,
    advancedAnalytics: true,
    customGoals: true,
    exportData: true,
    prioritySupport: true,
    measurementTracking: true,
    progressPhotos: true,
    socialFeatures: true,
    apiAccess: true,
    restTimer: true,
    ttsAudioCues: true
  }
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

interface SubscriptionProviderProps {
  children: ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [tier, setTier] = useState<SubscriptionTier>('foundation')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserSubscription()
  }, [])

  const loadUserSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // For MVP testing, we'll use localStorage to simulate subscription tiers
        // In production, this would come from your payment processor (Stripe, etc.)
        const savedTier = localStorage.getItem('x3-subscription-tier') as SubscriptionTier
        if (savedTier && ['foundation', 'momentum', 'mastery'].includes(savedTier)) {
          setTier(savedTier)
        } else {
          // Default to foundation tier
          setTier('foundation')
          localStorage.setItem('x3-subscription-tier', 'foundation')
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    return TIER_FEATURES[tier][feature] as boolean
  }

  const upgradeTo = (newTier: SubscriptionTier) => {
    setTier(newTier)
    localStorage.setItem('x3-subscription-tier', newTier)
  }

  const features = TIER_FEATURES[tier]

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        features,
        isLoading,
        hasFeature,
        upgradeTo
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const TIER_NAMES = {
  foundation: 'Foundation',
  momentum: 'Momentum',
  mastery: 'Mastery'
} as const

export const TIER_DESCRIPTIONS = {
  foundation: 'Essential X3 tracking with basic features',
  momentum: 'Enhanced tracking with AI coaching and analytics',
  mastery: 'Complete X3 experience with all premium features'
} as const

export const TIER_PRICING = {
  foundation: 4.99,
  momentum: 9.99,
  mastery: 19.99
} as const

export const TIER_PRICING_ANNUAL = {
  foundation: 49,
  momentum: 99,
  mastery: 199
} as const