'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WorkoutPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to root page which contains the actual workout functionality
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to workout...</p>
      </div>
    </div>
  )
}
