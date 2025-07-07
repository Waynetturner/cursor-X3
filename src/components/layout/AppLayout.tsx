'use client'

import { useRouter, usePathname } from 'next/navigation'
import { BarChart3, Calendar, Target, Settings, Flame } from 'lucide-react'
import { ReactNode } from 'react'
import X3MomentumWordmark from '../X3MomentumWordmark'

interface AppLayoutProps {
  children: ReactNode
  title?: string
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { icon: <Flame size={20} />, label: 'Workout', tooltip: 'Workout', route: '/' },
    { icon: <BarChart3 size={20} />, label: 'Stats', tooltip: 'Stats', route: '/stats' },
    { icon: <Calendar size={20} />, label: 'Calendar', tooltip: 'Calendar', route: '/calendar' },
    { icon: <Target size={20} />, label: 'Goals', tooltip: 'Goals', route: '/goals' },
    { icon: <Settings size={20} />, label: 'Settings', tooltip: 'Settings', route: '/settings' },
  ]

  return (
    <div className="min-h-screen brand-gradient">
      <div className="flex flex-col h-screen">
        {/* Hero banner with prominent X3 MOMENTUM branding as H1 */}
        <header className="w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 p-8 text-center shadow-lg">
          <div className="max-w-6xl mx-auto">
            <h1 className="mb-4 flex justify-center">
              <X3MomentumWordmark size="lg" />
            </h1>
            <h2 className="text-subhead mb-2 text-secondary">AI-Powered Resistance Band Tracking</h2>
          </div>
        </header>

        {/* Navigation - moved under hero banner */}
        <nav className="w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-center space-x-2 flex-wrap gap-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.route
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.route)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow text-sm md:text-base md:px-4 ${
                    isActive 
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
        </nav>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}