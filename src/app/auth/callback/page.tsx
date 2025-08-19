'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
          console.error('Auth callback error:', error)
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('Authentication successful! Redirecting...')
          
          // Create user profile if it doesn't exist
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const today = new Date().toISOString().split('T')[0]
            await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                x3_start_date: today,
                subscription_tier: 'foundation'
              })
          }

          // Redirect to home page after a short delay
          setTimeout(() => {
            router.push('/workout')
          }, 1500)
        } else {
          setStatus('error')
          setMessage('No session found. Please try signing in again.')
        }
      } catch (err) {
        setStatus('error')
        setMessage('An unexpected error occurred.')
        console.error('Auth callback error:', err)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <X3MomentumWordmark size="md" className="mx-auto mb-4" />
          </div>

          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Authenticating...</h2>
              <p className="text-gray-600">Please wait while we complete your sign-in.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Welcome to X3 Momentum Pro!</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-8 h-8 mx-auto text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Authentication Failed</h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 