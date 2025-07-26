'use client'

import { useState } from 'react'

interface AppleToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label: string
  description?: string
  color?: 'fire' | 'green' | 'blue' | 'purple'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string
}

const colorMap = {
  fire: {
    enabled: 'bg-orange-500',
    disabled: 'bg-gray-300'
  },
  green: {
    enabled: 'bg-green-500',
    disabled: 'bg-gray-300'  
  },
  blue: {
    enabled: 'bg-blue-500',
    disabled: 'bg-gray-300'
  },
  purple: {
    enabled: 'bg-purple-500',
    disabled: 'bg-gray-300'
  }
}

const sizeMap = {
  small: {
    container: 'w-10 h-6',
    thumb: 'w-4 h-4',
    translate: 'translate-x-4',
    text: 'text-body-small'
  },
  medium: {
    container: 'w-12 h-7',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    text: 'text-body'
  },
  large: {
    container: 'w-14 h-8',
    thumb: 'w-6 h-6',
    translate: 'translate-x-6',
    text: 'text-body-large'
  }
}

export default function AppleToggle({
  enabled,
  onChange,
  label,
  description,
  color = 'fire',
  size = 'medium',
  disabled = false,
  className = ''
}: AppleToggleProps) {
  const [isPressed, setIsPressed] = useState(false)
  
  const colors = colorMap[color]
  const sizes = sizeMap[size]

  const handleToggle = () => {
    if (disabled) return

    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(enabled ? 10 : 15) // Different vibration for on/off
    }

    onChange(!enabled)
  }

  const handleMouseDown = () => {
    if (!disabled) setIsPressed(true)
  }

  const handleMouseUp = () => {
    setIsPressed(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Label and Description */}
      <div className="flex-1 mr-4">
        <label 
          htmlFor={`toggle-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className={`block font-medium cursor-pointer ${sizes.text} ${
            disabled ? 'text-gray-400' : 'text-primary'
          }`}
        >
          {label}
        </label>
        {description && (
          <p className={`text-caption mt-1 ${
            disabled ? 'text-gray-400' : 'text-secondary'
          }`}>
            {description}
          </p>
        )}
      </div>

      {/* Toggle Switch */}
      <button
        id={`toggle-${label.replace(/\s+/g, '-').toLowerCase()}`}
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${label}`}
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          relative inline-flex items-center ${sizes.container} rounded-full
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-orange-500/20
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:scale-105 active:scale-95'
          }
          ${enabled ? colors.enabled : colors.disabled}
          ${isPressed ? 'scale-95' : ''}
        `}
        style={{
          willChange: 'transform, background-color'
        }}
      >
        {/* Toggle Thumb */}
        <span
          className={`
            inline-block ${sizes.thumb} bg-white rounded-full shadow-lg
            transition-all duration-200 ease-in-out transform
            ${enabled ? sizes.translate : 'translate-x-1'}
            ${isPressed ? 'scale-110' : ''}
            ${disabled ? 'shadow-md' : 'shadow-lg hover:shadow-xl'}
          `}
          style={{
            willChange: 'transform'
          }}
        >
          {/* Inner highlight for premium feel */}
          <span 
            className={`
              absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-100
              transition-opacity duration-200
              ${enabled ? 'opacity-100' : 'opacity-80'}
            `}
          />
        </span>

        {/* Optional icons or indicators */}
        {size === 'large' && (
          <>
            {/* "On" indicator */}
            <span 
              className={`
                absolute left-2 text-white text-xs font-bold
                transition-opacity duration-200
                ${enabled ? 'opacity-100' : 'opacity-0'}
              `}
            >
              ✓
            </span>
            
            {/* "Off" indicator */}
            <span 
              className={`
                absolute right-2 text-gray-400 text-xs font-bold
                transition-opacity duration-200
                ${!enabled ? 'opacity-100' : 'opacity-0'}
              `}
            >
              ✕
            </span>
          </>
        )}
      </button>
    </div>
  )
}

// Grouped toggle switches for settings sections
export function AppleToggleGroup({ 
  children, 
  title, 
  className = '' 
}: { 
  children: React.ReactNode
  title?: string 
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="text-label-large font-semibold text-secondary uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="bg-white rounded-xl p-6 card-elevation-1 space-y-6">
        {children}
      </div>
    </div>
  )
}