'use client'

import { Flame, BarChart3, Calendar, Target, Settings } from 'lucide-react'
import { useState } from 'react'

interface BottomNavProps {
  currentPath: string
  onNavigate: (path: string) => void
}

interface NavItem {
  icon: React.ElementType
  label: string
  path: string
  color: string
  badgeCount?: number
}

const navItems: NavItem[] = [
  { 
    icon: Flame, 
    label: 'Workout', 
    path: '/', 
    color: 'fire' 
  },
  { 
    icon: BarChart3, 
    label: 'Stats', 
    path: '/stats', 
    color: 'blue' 
  },
  { 
    icon: Calendar, 
    label: 'Calendar', 
    path: '/calendar', 
    color: 'green' 
  },
  { 
    icon: Target, 
    label: 'Goals', 
    path: '/goals', 
    color: 'purple' 
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    path: '/settings', 
    color: 'gray' 
  }
]

const colorMap = {
  fire: {
    active: 'text-orange-600 bg-orange-100',
    inactive: 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
  },
  blue: {
    active: 'text-blue-600 bg-blue-100',
    inactive: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
  },
  green: {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 hover:text-green-600 hover:bg-green-50'
  },
  purple: {
    active: 'text-purple-600 bg-purple-100',
    inactive: 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
  },
  gray: {
    active: 'text-gray-600 bg-gray-100',
    inactive: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
  }
}

export default function BottomNavigation({ currentPath, onNavigate }: BottomNavProps) {
  console.log('🍎 BottomNavigation rendering with path:', currentPath)
  const [pressedItem, setPressedItem] = useState<string | null>(null)

  const handleItemPress = (item: NavItem) => {
    // Apple-style bounce animation
    setPressedItem(item.path)
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10) // Short haptic feedback
    }
    
    // Navigate after animation
    setTimeout(() => {
      onNavigate(item.path)
      setPressedItem(null)
    }, 150)
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-4 py-2 z-50"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || 
              (item.path === '/' && (currentPath === '/' || currentPath === '/workout'))
            const isPressed = pressedItem === item.path
            const colors = colorMap[item.color as keyof typeof colorMap]
            
            return (
              <button
                key={item.label}
                onClick={() => handleItemPress(item)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 relative min-w-[60px] min-h-[60px]
                  ${isActive ? colors.active : colors.inactive}
                  ${isPressed ? 'scale-95' : 'scale-100'}
                  ${!isPressed ? 'hover:scale-105' : ''}
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                `}
                aria-label={`Navigate to ${item.label}`}
                style={{
                  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                  transition: 'transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)'
                }}
              >
                {/* Icon with bounce animation */}
                <div className={`
                  transition-transform duration-200 mb-1
                  ${isPressed ? 'scale-90' : 'scale-100'}
                `}>
                  <item.icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all duration-200"
                  />
                </div>
                
                {/* Label */}
                <span className={`
                  text-xs font-medium leading-none transition-all duration-200
                  ${isActive ? 'scale-105' : 'scale-100'}
                `}>
                  {item.label}
                </span>

                {/* Badge for notifications */}
                {item.badgeCount && item.badgeCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Spacer for bottom navigation on mobile */}
      <div 
        className="h-20" 
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      />
    </>
  )
}