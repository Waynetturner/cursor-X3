'use client'

import React from 'react'

export interface TTSStatusProps {
  hasFeature: boolean
  ttsLoading: boolean
  ttsError: string | null
  getSourceIndicator: () => string
}

export function TTSStatus({ 
  hasFeature, 
  ttsLoading, 
  ttsError, 
  getSourceIndicator 
}: TTSStatusProps) {
  if (!hasFeature) {
    return null
  }

  return (
    <div className="card-elevation-1 bg-apple-card spacing-apple-comfortable text-center mb-8 visual-depth-1 animate-on-load animate-apple-fade-in-up animate-delay-100">
      <div className="flex items-center justify-center space-x-2">
        {ttsLoading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            <span className="text-orange-600 text-sm font-medium">
              🔊 Speaking...
            </span>
          </div>
        )}
        {!ttsLoading && (
          <span className="text-body-small font-medium">
            {getSourceIndicator()}
          </span>
        )}
      </div>
      {ttsError && (
        <p className="text-body-small text-red-600 mt-1">
          ⚠️ {ttsError}
        </p>
      )}
      {!ttsError && !ttsLoading && (
        <p className="text-body-small text-gray-600 mt-1">
          Audio guidance ready for exercises
        </p>
      )}
    </div>
  )
}