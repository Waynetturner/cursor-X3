'use client'

import { useRouter } from 'next/navigation'
import { BarChart3, Calendar, Target, Settings, Flame } from 'lucide-react'
import { ReactNode } from 'react'
import X3MomentumWordmark from '../X3MomentumWordmark'

interface AppLayoutProps {
  children: ReactNode
  title?: string
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const router = useRouter()

  const navItems = [
    { icon: <BarChart3 size={20} />, label: 'Stats', tooltip: 'Stats', route: '/stats' },
    { icon: <Calendar size={20} />, label: 'Calendar', tooltip: 'Calendar', route: '/calendar' },
    { icon: <Target size={20} />, label: 'Goals', tooltip: 'Goals', route: '/goals' },
    { icon: <Settings size={20} />, label: 'Settings', tooltip: 'Settings', route: '/settings' },
  ]

  return (
    <div className="min-h-screen brand-gradient">
      <div className="flex flex-col h-screen">
        {/* Mobile navigation at top */}
        <nav className="md:hidden w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 p-4 shadow-lg">
          <div className="flex justify-around space-x-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow"
            >
              <Flame size={20} />
              <span>Home</span>
            </button>
            
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.route)}
                className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Hero banner with prominent X3 MOMENTUM branding as H1 */}
        <header className="w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 p-8 text-center shadow-lg">
          <h1 className="mb-0">
            <X3MomentumWordmark size="lg" />
          </h1>
        </header>
        
        <div className="flex md:flex-row flex-col flex-1">
          {/* Desktop sidebar navigation */}
          <nav className="hidden md:flex w-48 bg-white/90 backdrop-blur-lg border-r border-gray-200 p-4 shadow-lg flex-col space-y-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow"
            >
              <Flame size={20} />
              <span>Home</span>
            </button>
            
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.route)}
                className="flex items-center space-x-3 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-orange-600 px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Main content area */}
          <main className="flex-1 overflow-auto order-1 md:order-2">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}