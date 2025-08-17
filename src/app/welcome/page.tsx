'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import X3MomentumWordmark from '@/components/X3MomentumWordmark'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/workout')
      }
    }
    check()
  }, [router])

  return (
    <AppLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-3xl w-full text-center">
          <div className="mb-6 flex justify-center">
            <X3MomentumWordmark size="lg" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">AI-Powered X3 Resistance Band Tracker</h1>
          <p className="text-lg text-gray-600 mb-8">Motivation. Progress. Results.</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="btn-apple-style bg-orange-600 text-white hover:bg-orange-700"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="btn-apple-style btn-secondary"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
