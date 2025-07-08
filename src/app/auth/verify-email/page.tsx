'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [isResent, setIsResent] = useState(false)
  const router = useRouter()

  const handleResendEmail = async () => {
    if (!email) return

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Resend error:', error)
      } else {
        setIsResent(true)
        setTimeout(() => setIsResent(false), 5000)
      }
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 p-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/auth/signup')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign Up
          </button>
          <div className="text-center">
            <X3MomentumWordmark size="md" className="mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
            <p className="text-gray-600">We've sent you a verification link</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify Your Email Address</h2>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to your email address. Please check your inbox and click the link to complete your registration.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-blue-900">What happens next?</h3>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Check your email inbox (and spam folder)</li>
                      <li>• Click the verification link in the email</li>
                      <li>• You'll be automatically signed in</li>
                      <li>• Start your X3 journey!</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Didn't receive the email? Check your spam folder or try a different email address.
                </p>
                
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  
                  <button
                    onClick={handleResendEmail}
                    disabled={!email || isResent}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {isResent ? 'Email Sent!' : 'Resend Verification Email'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">
                  Already verified?{' '}
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 