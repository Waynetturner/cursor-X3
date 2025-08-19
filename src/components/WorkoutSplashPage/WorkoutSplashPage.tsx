'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Play, Flame, Calendar, ArrowRight, Sparkles, TrendingUp, Users, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { announceToScreenReader } from '@/lib/accessibility'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'

export function WorkoutSplashPage() {
  const router = useRouter()

  const signIn = async () => {
    announceToScreenReader('Redirecting to sign in...')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) {
      announceToScreenReader('Sign in error. Please try again.', 'assertive')
      console.log('Error:', error)
    }
  }

  const signUpWithEmail = () => {
    router.push('/auth/signup')
  }

  const signInWithEmail = () => {
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <header className="w-full bg-white border-b border-gray-200 p-8 text-center shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="mb-4 flex justify-center">
            <X3MomentumWordmark size="lg" />
          </h1>
          <h2 className="text-headline-medium mb-2 text-secondary">AI-Powered X3 Resistance Band Tracker</h2>
          <p className="text-body italic text-secondary">Motivation. Progress. Results.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Feature Grid - Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* AI Coaching Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">AI Coaching</h3>
            </div>
            <p className="text-gray-600 mb-4">Personalized guidance and motivation to keep you on track with your X3 journey.</p>
            <div className="flex items-center text-sm text-orange-600">
              <span>Smart insights</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Progress Analytics Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Progress Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">Track your strength gains, workout consistency, and personal bests over time.</p>
            <div className="flex items-center text-sm text-blue-600">
              <span>Data-driven insights</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* X3 Optimization Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <Flame className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">X3 Optimization</h3>
            </div>
            <p className="text-gray-600 mb-4">Specifically designed for X3 resistance bands and Dr. Jaquish&apos;s methodology.</p>
            <div className="flex items-center text-sm text-red-600">
              <span>Proven system</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Community Support Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Community Support</h3>
            </div>
            <p className="text-gray-600 mb-4">Connect with fellow X3 users and share your progress and achievements.</p>
            <div className="flex items-center text-sm text-green-600">
              <span>Join the movement</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Premium Security Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Premium Security</h3>
            </div>
            <p className="text-gray-600 mb-4">Enterprise-grade security to protect your personal fitness data and progress.</p>
            <div className="flex items-center text-sm text-purple-600">
              <span>Your data is safe</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Smart Scheduling Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Smart Scheduling</h3>
            </div>
            <p className="text-gray-600 mb-4">Automated workout scheduling based on the proven X3 program structure.</p>
            <div className="flex items-center text-sm text-indigo-600">
              <span>Never miss a workout</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform Your X3 Journey?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of X3 users who have eliminated motivation drop-off and achieved consistent results. 
            Start your personalized AI-powered fitness journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={signInWithEmail}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Sign In
            </button>
            <button 
              onClick={signUpWithEmail}
              className="bg-white hover:bg-gray-50 text-orange-600 font-semibold py-3 px-8 rounded-lg border-2 border-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Get Started Free
            </button>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={signIn}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center mx-auto"
            >
              <span>Or continue with Google</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}