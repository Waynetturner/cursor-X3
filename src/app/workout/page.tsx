'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WorkoutRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to root page which is the main dashboard
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
