/**
 * Utility Functions - Barrel Export
 * 
 * Centralized exports for all utility functions in the X3 Tracker application.
 * Provides clean imports and tree-shaking support for optimal bundle size.
 * 
 * Usage:
 * import { DataTransformer, SupabaseHelpers, UIStateManager } from '@/utils'
 * import { formatWorkoutDate, safeQuery, createLoadingState } from '@/utils'
 */

// Data transformation utilities
export {
  DataTransformer,
  formatWorkoutDate,
  calculateBandRank,
  getHighestBand,
  formatExerciseDisplay,
  formatDuration,
  calculateCompletionPercentage,
  formatRepCount,
  parseBandColor,
  formatWorkoutSummary,
  formatStreakDisplay,
  formatWeightDisplay,
  getBandProgression
} from './data-transformers'

// Supabase helper utilities
export {
  SupabaseHelpers,
  DatabaseError,
  safeQuery,
  getUserWorkouts,
  getExerciseHistory,
  getCompletedWorkoutDates,
  insertExercise,
  updateUserProfile,
  getOrCreateProfile,
  checkExerciseExists,
  getWorkoutStats,
  formatDatabaseError,
  batchInsert
} from './supabase-helpers'

export type {
  AppError as SupabaseAppError,
  QueryFilters,
  SafeQueryResult
} from './supabase-helpers'

// Error handling utilities
export {
  ErrorHandlingService,
  safeAsync,
  createErrorBoundaryHandler,
  handleError,
  createUserFriendlyError,
  showErrorToUser,
  reportError,
  createValidationError,
  createBusinessError
} from './error-handler'

// UI state management utilities
export {
  UIStateManager,
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
} from './ui-state'

export type {
  LoadingState,
  LoadingVariant,
  ErrorState,
  AsyncState,
  FormState
} from './ui-state'

// Re-export common types for convenience
export type {
  ErrorCode,
  ErrorSeverity,
  AppError,
  ValidationError,
  NetworkError,
  AuthError,
  BusinessError,
  RecoveryAction,
  ErrorReport
} from '@/types/errors'

/**
 * Utility function combinations for common use cases
 */

/**
 * Complete async operation with loading and error handling
 */
export async function performAsyncOperation<T>(
  operation: () => Promise<T>,
  context: string,
  onLoadingChange?: (loading: LoadingState) => void,
  onError?: (error: AppError) => void
) {
  // Set loading state
  const loadingState = UIStateManager.createLoadingState(true, {
    loadingText: UIStateManager.getLoadingText('load', context)
  })
  onLoadingChange?.(loadingState)

  try {
    // Execute operation with error handling
    const { data, error } = await safeAsync(operation, context)
    
    // Clear loading state
    onLoadingChange?.(UIStateManager.createLoadingState(false))

    if (error) {
      onError?.(error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (unexpectedError) {
    onLoadingChange?.(UIStateManager.createLoadingState(false))
    const appError = ErrorHandlingService.handleError(unexpectedError, context)
    onError?.(appError)
    return { data: null, error: appError }
  }
}

/**
 * Format database record for UI display
 */
export function formatRecordForDisplay(record: any): {
  displayName: string
  formattedDate: string
  repSummary: string
  bandDisplay: string
} {
  return {
    displayName: DataTransformer.formatExerciseDisplay(
      record.exercise_name,
      record.full_reps,
      record.band_color
    ),
    formattedDate: DataTransformer.formatWorkoutDate(record.workout_local_date_time),
    repSummary: DataTransformer.formatRepCount(record.full_reps, record.partial_reps),
    bandDisplay: `${record.band_color} Band`
  }
}

/**
 * Validate and transform form data for API submission
 */
export function prepareFormDataForSubmission<T extends Record<string, unknown>>(
  formData: T,
  transformers: Record<string, (value: any) => any> = {}
): { data: T | null; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {}
  const transformedData = { ...formData }

  // Apply transformations
  Object.entries(transformers).forEach(([key, transformer]) => {
    if (key in transformedData) {
      try {
        transformedData[key as keyof T] = transformer(transformedData[key as keyof T])
      } catch (error) {
        errors[key] = [`Invalid ${key} format`]
      }
    }
  })

  // Return results
  if (Object.keys(errors).length > 0) {
    return { data: null, errors }
  }

  return { data: transformedData, errors: {} }
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phoneNumber: /^\+?[\d\s\-\(\)]+$/,
  
  validateEmail: (email: string): boolean => ValidationPatterns.email.test(email),
  validatePassword: (password: string): boolean => ValidationPatterns.strongPassword.test(password),
  validatePhoneNumber: (phone: string): boolean => ValidationPatterns.phoneNumber.test(phone),
  
  validateRequired: (value: unknown): boolean => {
    return value !== null && value !== undefined && value !== ''
  },
  
  validateMinLength: (value: string, minLength: number): boolean => {
    return typeof value === 'string' && value.length >= minLength
  },
  
  validateMaxLength: (value: string, maxLength: number): boolean => {
    return typeof value === 'string' && value.length <= maxLength
  },
  
  validateNumberRange: (value: number, min: number, max: number): boolean => {
    return typeof value === 'number' && value >= min && value <= max
  }
}

/**
 * Constants for common use cases
 */
export const Constants = {
  // Animation durations (in ms)
  ANIMATION_DURATION_FAST: 150,
  ANIMATION_DURATION_NORMAL: 300,
  ANIMATION_DURATION_SLOW: 500,
  
  // Timeouts (in ms)
  DEBOUNCE_DELAY_SHORT: 300,
  DEBOUNCE_DELAY_NORMAL: 500,
  DEBOUNCE_DELAY_LONG: 1000,
  
  // API settings
  API_TIMEOUT_SHORT: 5000,
  API_TIMEOUT_NORMAL: 10000,
  API_TIMEOUT_LONG: 30000,
  
  // Cache durations (in ms)
  CACHE_TTL_SHORT: 60000,     // 1 minute
  CACHE_TTL_NORMAL: 300000,   // 5 minutes
  CACHE_TTL_LONG: 900000,     // 15 minutes
  CACHE_TTL_EXTENDED: 3600000, // 1 hour
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // File sizes (in bytes)
  MAX_FILE_SIZE_SMALL: 1024 * 1024,      // 1MB
  MAX_FILE_SIZE_MEDIUM: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_LARGE: 10 * 1024 * 1024, // 10MB
  
  // Breakpoints (in px, matching Tailwind CSS)
  BREAKPOINT_SM: 640,
  BREAKPOINT_MD: 768,
  BREAKPOINT_LG: 1024,
  BREAKPOINT_XL: 1280,
  BREAKPOINT_2XL: 1536
}