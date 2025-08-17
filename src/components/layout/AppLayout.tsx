'use client'

import { useRouter, usePathname } from 'next/navigation'
import { BarChart3, Calendar, Target, Settings, Flame, LogOut, FlaskConical } from 'lucide-react'
import { ReactNode } from 'react'
import X3MomentumWordmark from '../X3MomentumWordmark'
import { supabase } from '@/lib/supabase'
import { useTestMode } from '@/lib/test-mode'
import BottomNavigation from './BottomNavigation'
import ContextualFAB from './FloatingActionButton'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  onStartExercise?: () => void
  onLogWorkout?: () => void
  onAddGoal?: () => void
  onScheduleWorkout?: () => void
  onViewStats?: () => void
  exerciseInProgress?: boolean
  workoutCompleted?: boolean
}

export default function AppLayout({
  children,
  onStartExercise,
  onLogWorkout,
  onAddGoal,
  onScheduleWorkout,
  onViewStats,
  exerciseInProgress = false,
  workoutCompleted = false
}: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isEnabled: testModeEnabled, indicator } = useTestMode()

  const navItems = [
    { icon: <Flame size={20} />, label: 'Workout', tooltip: 'Workout', route: '/workout' },
    { icon: <BarChart3 size={20} />, label: 'Stats', tooltip: 'Stats', route: '/stats' },
    { icon: <Calendar size={20} />, label: 'Calendar', tooltip: 'Calendar', route: '/calendar' },
        { icon: <Settings size={20} />, label: 'Settings', tooltip: 'Settings', route: '/settings' },
    { icon: <LogOut size={20} />, label: 'Sign Out', tooltip: 'Sign Out', route: '/auth/signin' },
  ]

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    } else {
      router.push('/auth/signin')
    }
  }

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/20 via-white to-red-50/20">
      <div className="flex flex-col h-screen">
        {/* Apple-style Hero Header */}
        <header className="w-full bg-gradient-to-b from-white via-orange-50/30 to-white backdrop-blur-xl border-b border-orange-200/30 px-8 py-12 text-center shadow-2xl">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 transform hover:scale-105 transition-all duration-500 ease-out flex justify-center">
              <X3MomentumWordmark size="lg" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-orange-700 bg-clip-text text-transparent mb-3">
              AI-Powered Resistance Band Tracking
            </h2>
            <p className="text-lg text-gray-600 font-medium">Precision. Progress. Performance.</p>
          </div>
        </header>

        {/* Test Mode Indicator */}
        {testModeEnabled && (
          <div className="w-full bg-purple-600 text-white text-center py-2 px-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <FlaskConical size={16} />
              <span>{indicator}</span>
            </div>
          </div>
        )}

        {/* Desktop Navigation - hidden on mobile */}
        <nav className="w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 p-4 shadow-lg hidden md:block">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-center items-center">
              <div className="flex space-x-2 flex-wrap gap-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.route ||
                    (item.label === 'Workout' && (pathname === '/' || pathname === '/workout'))
                  const isSignOut = item.label === 'Sign Out'
                  return (
                    <button
                      key={item.label}
                      onClick={() => isSignOut ? handleSignOut() : router.push(item.route)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow text-base ${
                        isSignOut
                          ? 'bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800'
                          : isActive
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-orange-600'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Mobile Navigation Components */}
        <BottomNavigation
          currentPath={pathname}
          onNavigate={handleNavigate}
        />

        <ContextualFAB
          onStartExercise={onStartExercise}
          onLogWorkout={onLogWorkout}
                    onScheduleWorkout={onScheduleWorkout}
          onViewStats={onViewStats}
          exerciseInProgress={exerciseInProgress}
          workoutCompleted={workoutCompleted}
        />
      </div>
    </div>
  )
}
