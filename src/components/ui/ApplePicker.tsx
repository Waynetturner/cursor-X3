'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, Check } from 'lucide-react'

interface ApplePickerProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  disabled?: boolean
  color?: 'fire' | 'green' | 'blue' | 'purple'
}

const colorMap = {
  fire: {
    accent: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    ring: 'focus:ring-orange-500/20'
  },
  green: {
    accent: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-500',
    ring: 'focus:ring-green-500/20'
  },
  blue: {
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    ring: 'focus:ring-blue-500/20'
  },
  purple: {
    accent: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    ring: 'focus:ring-purple-500/20'
  }
}

export default function ApplePicker({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  disabled = false,
  color = 'fire'
}: ApplePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(
    options.findIndex(option => option === value) || 0
  )
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const pickerRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  
  const colors = colorMap[color]
  const selectedOption = options[selectedIndex] || placeholder

  useEffect(() => {
    const newIndex = options.findIndex(option => option === value)
    if (newIndex !== -1 && newIndex !== selectedIndex) {
      setSelectedIndex(newIndex)
    }
  }, [value, options, selectedIndex])

  const scrollToIndex = (index: number) => {
    if (optionsRef.current) {
      const itemHeight = 44 // Height of each option
      const scrollTop = index * itemHeight - itemHeight // Center the selected item
      optionsRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }

  const handleSelect = (option: string, index: number) => {
    setSelectedIndex(index)
    onChange(option)
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    // Close picker after brief delay
    setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDragging) return
    
    const currentTouch = e.touches[0].clientY
    const diff = touchStart - currentTouch
    const sensitivity = 30 // pixels needed to trigger selection change
    
    if (Math.abs(diff) > sensitivity) {
      const direction = diff > 0 ? 1 : -1
      const newIndex = Math.max(0, Math.min(options.length - 1, selectedIndex + direction))
      
      if (newIndex !== selectedIndex) {
        setSelectedIndex(newIndex)
        setTouchStart(currentTouch) // Reset touch start for continuous scrolling
      }
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      handleSelect(options[selectedIndex], selectedIndex)
    }
    setTouchStart(null)
    setIsDragging(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault()
      const newIndex = Math.max(0, selectedIndex - 1)
      setSelectedIndex(newIndex)
      scrollToIndex(newIndex)
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault()
      const newIndex = Math.min(options.length - 1, selectedIndex + 1)
      setSelectedIndex(newIndex)
      scrollToIndex(newIndex)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={pickerRef} className="relative">
      {/* Label */}
      <label className="block text-label-large mb-2 text-secondary font-medium">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left text-body
          focus:outline-none focus:ring-2 ${colors.ring} focus:border-orange-500
          transition-all duration-200 hover:border-gray-300 min-h-[44px]
          flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? `${colors.border} ring-2 ${colors.ring}` : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${label}. Currently selected: ${selectedOption}`}
      >
        <span className={value ? 'text-primary' : 'text-gray-400'}>
          {selectedOption}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* iOS-Style Picker Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:relative md:inset-auto">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl md:relative md:bottom-auto md:rounded-xl md:shadow-lg md:mt-2 md:border md:border-gray-200">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
              <button
                onClick={() => setIsOpen(false)}
                className="text-orange-600 font-medium"
              >
                Cancel
              </button>
              <h3 className="text-body-emphasized font-semibold">{label}</h3>
              <button
                onClick={() => handleSelect(options[selectedIndex], selectedIndex)}
                className="text-orange-600 font-medium"
              >
                Done
              </button>
            </div>

            {/* Picker Options */}
            <div 
              ref={optionsRef}
              className="max-h-60 overflow-y-auto py-2 md:max-h-48"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option, index)}
                  className={`
                    w-full px-4 py-3 text-left text-body transition-all duration-150
                    flex items-center justify-between min-h-[44px]
                    ${index === selectedIndex 
                      ? `${colors.bg} ${colors.accent} font-medium` 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <span>{option}</span>
                  {index === selectedIndex && (
                    <Check className={`w-5 h-5 ${colors.accent}`} />
                  )}
                </button>
              ))}
            </div>

            {/* Desktop Navigation Hints */}
            <div className="hidden md:flex items-center justify-center space-x-4 py-2 text-xs text-gray-500 border-t border-gray-200">
              <div className="flex items-center space-x-1">
                <ChevronUp className="w-3 h-3" />
                <ChevronDown className="w-3 h-3" />
                <span>Arrow keys to navigate</span>
              </div>
              <span>•</span>
              <span>Enter to select</span>
              <span>•</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}