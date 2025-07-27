'use client'

import { Play, Plus, BarChart3, Target, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface FABProps {
  action: 'startExercise' | 'logWorkout' | 'addGoal' | 'scheduleWorkout' | 'viewStats'
  onPress: () => void
  disabled?: boolean
  label?: string
  className?: string
}

interface ContextualFABProps {
  onStartExercise?: () => void
  onLogWorkout?: () => void
  onAddGoal?: () => void
  onScheduleWorkout?: () => void
  onViewStats?: () => void
  exerciseInProgress?: boolean
  workoutCompleted?: boolean
}

const actionConfig = {
  startExercise: {
    icon: Play,
    label: 'Start Exercise',
    gradient: 'from-green-500 to-green-600',
    hoverGradient: 'from-green-600 to-green-700',
    ariaLabel: 'Start exercise routine'
  },
  logWorkout: {
    icon: Plus,
    label: 'Log Workout',
    gradient: 'from-orange-500 to-orange-600',
    hoverGradient: 'from-orange-600 to-orange-700',
    ariaLabel: 'Log workout data'
  },
  addGoal: {
    icon: Target,
    label: 'Add Goal',
    gradient: 'from-purple-500 to-purple-600',
    hoverGradient: 'from-purple-600 to-purple-700',
    ariaLabel: 'Add new fitness goal'
  },
  scheduleWorkout: {
    icon: Calendar,
    label: 'Schedule',
    gradient: 'from-blue-500 to-blue-600',
    hoverGradient: 'from-blue-600 to-blue-700',
    ariaLabel: 'Schedule workout'
  },
  viewStats: {
    icon: BarChart3,
    label: 'View Stats',
    gradient: 'from-indigo-500 to-indigo-600',
    hoverGradient: 'from-indigo-600 to-indigo-700',
    ariaLabel: 'View workout statistics'
  }
}

export function FloatingActionButton({ 
  action, 
  onPress, 
  disabled = false, 
  label, 
  className = '' 
}: FABProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  const config = actionConfig[action]
  const Icon = config.icon
  const displayLabel = label || config.label

  const handlePress = () => {
    if (disabled) return

    setIsPressed(true)
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(15)
    }

    // Spring animation then action
    setTimeout(() => {
      onPress()
      setIsPressed(false)
    }, 150)
  }

  // Entrance animation
  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [action])

  return (
    <button
      onClick={handlePress}
      disabled={disabled}
      aria-label={config.ariaLabel}
      className={`
        fixed bottom-24 right-6 z-40 
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-4 focus:ring-orange-500/30
        ${disabled 
          ? 'bg-gray-400 cursor-not-allowed opacity-75' 
          : `bg-gradient-to-br ${config.gradient} hover:bg-gradient-to-br hover:${config.hoverGradient} cursor-pointer`
        }
        ${isPressed ? 'scale-90' : 'scale-100'}
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        ${!disabled && !isPressed ? 'hover:scale-110 hover:shadow-xl' : ''}
        md:hidden
        ${className}
      `}
      style={{
        paddingBottom: 'max(24px, env(safe-area-inset-bottom) + 16px)',
        transform: `scale(${isPressed ? 0.9 : 1}) translateY(${isVisible ? 0 : 16}px)`,
        transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}
    >
      <Icon 
        size={24} 
        className={`text-white transition-transform duration-200 ${
          isPressed ? 'scale-90' : 'scale-100'
        }`}
        strokeWidth={2.5}
      />
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 pointer-events-none transition-opacity duration-200 hover:opacity-100 whitespace-nowrap">
        {displayLabel}
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
      </div>
    </button>
  )
}

export function ContextualFAB({
  onStartExercise,
  onLogWorkout,
  onAddGoal,
  onScheduleWorkout,
  onViewStats,
  exerciseInProgress = false,
  workoutCompleted = false
}: ContextualFABProps) {
  const pathname = usePathname()

  // Determine contextual action based on current page and state
  const getContextualAction = (): { action: FABProps['action'], onPress: () => void } => {
    // Workout page logic
    if (pathname === '/' || pathname === '/workout') {
      if (workoutCompleted && onLogWorkout) {
        return { action: 'logWorkout', onPress: onLogWorkout }
      }
      if (!exerciseInProgress && onStartExercise) {
        return { action: 'startExercise', onPress: onStartExercise }
      }
      if (onViewStats) {
        return { action: 'viewStats', onPress: onViewStats }
      }
    }

    // Stats page
    if (pathname === '/stats' && onLogWorkout) {
      return { action: 'logWorkout', onPress: onLogWorkout }
    }

    // Calendar page
    if (pathname === '/calendar' && onScheduleWorkout) {
      return { action: 'scheduleWorkout', onPress: onScheduleWorkout }
    }

    // Goals page
    if (pathname === '/goals' && onAddGoal) {
      return { action: 'addGoal', onPress: onAddGoal }
    }

    // Default fallback
    if (onStartExercise) {
      return { action: 'startExercise', onPress: onStartExercise }
    }

    // Final fallback
    return { action: 'viewStats', onPress: onViewStats || (() => {}) }
  }

  const { action, onPress } = getContextualAction()

  return (
    <FloatingActionButton
      action={action}
      onPress={onPress}
      disabled={exerciseInProgress && action === 'startExercise'}
    />
  )
}

export default ContextualFAB