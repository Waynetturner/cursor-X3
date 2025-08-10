'use client'

import React from 'react'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'
import { AuthenticatedUser } from '@/types/workout'

export interface LoadingViewProps {
  user: AuthenticatedUser | null
  exerciseCount: number
}

export function LoadingView({ user, exerciseCount }: LoadingViewProps) {
  return (
    <div className="min-h-screen brand-gradient">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="card-elevation-2 bg-white rounded-xl p-6 text-center max-w-md mx-4">
          <div className="mb-6">
            <X3MomentumWordmark size="md" className="mx-auto mb-4" />
            <h2 className="text-headline-medium mb-2 text-secondary">Loading...</h2>
          </div>
          <div className="text-body mb-4" role="status" aria-live="polite">
            {user ? 'Loading your workout...' : 'Please sign in to continue'}
          </div>
          {user && (
            <div className="text-body-small text-secondary space-y-1">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Exercises loaded: {exerciseCount}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}