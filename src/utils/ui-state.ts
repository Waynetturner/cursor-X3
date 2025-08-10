/**
 * UI State Management Utilities
 * 
 * Centralized utilities for consistent UI state patterns across the X3 Tracker application.
 * Provides standardized loading states, error states, and UI helpers.
 */

import { AppError, ErrorCode } from '@/types/errors'

/**
 * Standard loading state interface
 */
export interface LoadingState {
  isLoading: boolean
  loadingText?: string
  progress?: number
  variant?: LoadingVariant
}

export type LoadingVariant = 'spinner' | 'skeleton' | 'progress' | 'pulse'

/**
 * Standard error state interface
 */
export interface ErrorState {
  hasError: boolean
  error: AppError | null
  canRetry: boolean
  retryCount: number
}

/**
 * Async operation state interface
 */
export interface AsyncState<T = unknown> {
  data: T | null
  loading: LoadingState
  error: ErrorState
  lastUpdated?: string
}

/**
 * Form state interface
 */
export interface FormState<T = Record<string, unknown>> {
  values: T
  errors: Record<string, string[]>
  touched: Record<string, boolean>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
}

/**
 * UI State Manager - Central utility class for UI state management
 */
export class UIStateManager {
  /**
   * Create a loading state with consistent defaults
   */
  static createLoadingState(
    isLoading: boolean = true,
    options?: Partial<LoadingState>
  ): LoadingState {
    return {
      isLoading,
      loadingText: isLoading ? 'Loading...' : undefined,
      variant: 'spinner',
      ...options
    }
  }

  /**
   * Create an error state from various error types
   */
  static createErrorState(error: unknown, canRetry: boolean = true): ErrorState {
    let appError: AppError

    if (this.isAppError(error)) {
      appError = error
    } else if (error instanceof Error) {
      appError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message,
        userMessage: 'Something went wrong. Please try again.',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }
    } else {
      appError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Unknown error occurred',
        userMessage: 'Something unexpected happened. Please try again.',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }
    }

    return {
      hasError: true,
      error: appError,
      canRetry: canRetry && this.isRetryableError(appError.code),
      retryCount: 0
    }
  }

  /**
   * Create a complete async state object
   */
  static createAsyncState<T>(
    data: T | null = null,
    loading: boolean = false,
    error: unknown = null
  ): AsyncState<T> {
    return {
      data,
      loading: this.createLoadingState(loading),
      error: error ? this.createErrorState(error) : { hasError: false, error: null, canRetry: false, retryCount: 0 },
      lastUpdated: data ? new Date().toISOString() : undefined
    }
  }

  /**
   * Update async state with new data
   */
  static updateAsyncState<T>(
    currentState: AsyncState<T>,
    update: Partial<AsyncState<T>>
  ): AsyncState<T> {
    return {
      ...currentState,
      ...update,
      lastUpdated: update.data !== undefined ? new Date().toISOString() : currentState.lastUpdated
    }
  }

  /**
   * Create initial form state
   */
  static createFormState<T extends Record<string, unknown>>(
    initialValues: T
  ): FormState<T> {
    return {
      values: initialValues,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
      isSubmitting: false
    }
  }

  /**
   * Update form field value and validation state
   */
  static updateFormField<T extends Record<string, unknown>>(
    formState: FormState<T>,
    fieldName: keyof T,
    value: T[keyof T],
    validator?: (value: T[keyof T]) => string[]
  ): FormState<T> {
    const newValues = { ...formState.values, [fieldName]: value }
    const newTouched = { ...formState.touched, [fieldName]: true }
    
    let newErrors = { ...formState.errors }
    if (validator) {
      const fieldErrors = validator(value)
      if (fieldErrors.length > 0) {
        newErrors[fieldName as string] = fieldErrors
      } else {
        delete newErrors[fieldName as string]
      }
    }

    const isValid = Object.keys(newErrors).length === 0
    const isDirty = this.hasFormChanged(formState.values, newValues)

    return {
      ...formState,
      values: newValues,
      errors: newErrors,
      touched: newTouched,
      isValid,
      isDirty
    }
  }

  /**
   * Merge multiple CSS class names, handling conditionals
   */
  static mergeClassNames(...classes: (string | undefined | null | false)[]): string {
    return classes
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Create conditional class names based on state
   */
  static conditionalClasses(
    baseClasses: string,
    conditions: Record<string, boolean | undefined>
  ): string {
    const conditionalClasses = Object.entries(conditions)
      .filter(([, condition]) => Boolean(condition))
      .map(([className]) => className)

    return this.mergeClassNames(baseClasses, ...conditionalClasses)
  }

  /**
   * Generate loading text based on operation type
   */
  static getLoadingText(operation: string, context?: string): string {
    const operationTexts: Record<string, string> = {
      save: 'Saving...',
      load: 'Loading...',
      delete: 'Deleting...',
      update: 'Updating...',
      create: 'Creating...',
      fetch: 'Fetching...',
      upload: 'Uploading...',
      download: 'Downloading...',
      signin: 'Signing in...',
      signup: 'Creating account...',
      signout: 'Signing out...'
    }

    const baseText = operationTexts[operation.toLowerCase()] || 'Processing...'
    return context ? `${baseText} ${context}` : baseText
  }

  /**
   * Create progress loading state
   */
  static createProgressState(
    current: number,
    total: number,
    operation: string = 'Processing'
  ): LoadingState {
    const progress = Math.round((current / total) * 100)
    return {
      isLoading: current < total,
      loadingText: `${operation} ${current} of ${total}`,
      progress,
      variant: 'progress'
    }
  }

  /**
   * Debounce utility for form inputs and search
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }) as T
  }

  /**
   * Throttle utility for scroll handlers and resize events
   */
  static throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): T {
    let inThrottle: boolean
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }

  /**
   * Create pagination state
   */
  static createPaginationState(
    currentPage: number = 1,
    pageSize: number = 10,
    totalItems: number = 0
  ) {
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Format duration for display (seconds to human readable)
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${remainingSeconds}s`
    }
  }

  /**
   * Animate number changes for smooth transitions
   */
  static animateNumber(
    from: number,
    to: number,
    duration: number,
    onUpdate: (value: number) => void,
    easing: (t: number) => number = (t) => t
  ): void {
    const startTime = Date.now()
    const difference = to - from

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easing(progress)
      const currentValue = Math.round(from + difference * easedProgress)

      onUpdate(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }

  /**
   * Private helper methods
   */
  private static isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'userMessage' in error
    )
  }

  private static isRetryableError(errorCode: ErrorCode): boolean {
    const nonRetryableErrors = [
      ErrorCode.PERMISSION_DENIED,
      ErrorCode.UNAUTHORIZED,
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.INVALID_INPUT,
      ErrorCode.SUBSCRIPTION_REQUIRED,
      ErrorCode.FEATURE_NOT_AVAILABLE
    ]
    return !nonRetryableErrors.includes(errorCode)
  }

  private static hasFormChanged<T extends Record<string, unknown>>(
    original: T,
    current: T
  ): boolean {
    const originalKeys = Object.keys(original)
    const currentKeys = Object.keys(current)

    if (originalKeys.length !== currentKeys.length) {
      return true
    }

    for (const key of originalKeys) {
      if (original[key] !== current[key]) {
        return true
      }
    }

    return false
  }
}

/**
 * React hook-style utilities (for future use with custom hooks)
 */
export const useAsyncState = <T>(initialData: T | null = null) => {
  // This would be implemented as a custom React hook
  // Placeholder for the pattern
  return {
    state: UIStateManager.createAsyncState(initialData),
    setLoading: (loading: boolean) => {},
    setData: (data: T) => {},
    setError: (error: unknown) => {},
    reset: () => {}
  }
}

/**
 * Export individual functions for tree-shaking
 */
export const {
  createLoadingState,
  createErrorState,
  createAsyncState,
  updateAsyncState,
  createFormState,
  updateFormField,
  mergeClassNames,
  conditionalClasses,
  getLoadingText,
  createProgressState,
  debounce,
  throttle,
  createPaginationState,
  formatFileSize,
  formatDuration,
  animateNumber
} = UIStateManager