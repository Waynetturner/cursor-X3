/**
 * Error Type Definitions
 * 
 * Centralized error types for consistent error handling throughout the X3 Tracker application.
 * Provides standardized error codes, messages, and user feedback patterns.
 */

/**
 * Standard error codes used throughout the application
 * Allows for consistent error handling and user messaging
 */
export enum ErrorCode {
  // Network and connectivity errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  OFFLINE = 'OFFLINE',

  // Authentication and authorization errors
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Database and API errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Validation and input errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Business logic errors
  WORKOUT_NOT_FOUND = 'WORKOUT_NOT_FOUND',
  EXERCISE_ALREADY_COMPLETED = 'EXERCISE_ALREADY_COMPLETED',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',

  // System and application errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Error severity levels for prioritizing error handling and logging
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Standard application error interface
 * Used consistently across all error handling in the application
 */
export interface AppError {
  /** Standardized error code for programmatic handling */
  code: ErrorCode
  
  /** Technical error message for developers/logging */
  message: string
  
  /** User-friendly error message for display */
  userMessage: string
  
  /** Error severity level for handling priority */
  severity: ErrorSeverity
  
  /** Timestamp when the error occurred */
  timestamp: string
  
  /** Context where the error occurred (component, service, etc.) */
  context?: string
  
  /** Additional error details for debugging */
  details?: {
    originalError?: unknown
    stack?: string
    statusCode?: number
    metadata?: Record<string, unknown>
  }
  
  /** Suggested recovery actions */
  recoveryActions?: RecoveryAction[]
}

/**
 * Recovery action suggestions for errors
 */
export interface RecoveryAction {
  /** Action identifier */
  action: 'retry' | 'refresh' | 'signin' | 'contact_support' | 'upgrade' | 'custom'
  
  /** Display label for the action */
  label: string
  
  /** Handler function for the action */
  handler: () => void | Promise<void>
  
  /** Whether this is the primary suggested action */
  primary?: boolean
}

/**
 * Validation error details
 */
export interface ValidationError extends AppError {
  code: ErrorCode.VALIDATION_ERROR | ErrorCode.INVALID_INPUT | ErrorCode.REQUIRED_FIELD | ErrorCode.INVALID_FORMAT
  
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string[]>
  
  /** Form-level validation errors */
  formErrors?: string[]
}

/**
 * Network error details
 */
export interface NetworkError extends AppError {
  code: ErrorCode.NETWORK_ERROR | ErrorCode.CONNECTION_TIMEOUT | ErrorCode.OFFLINE
  
  /** Network-specific details */
  details?: {
    url?: string
    method?: string
    statusCode?: number
    responseText?: string
    timeout?: number
  }
}

/**
 * Authentication error details
 */
export interface AuthError extends AppError {
  code: ErrorCode.AUTH_ERROR | ErrorCode.PERMISSION_DENIED | ErrorCode.SESSION_EXPIRED | ErrorCode.UNAUTHORIZED
  
  /** Authentication-specific details */
  details?: {
    provider?: string
    redirectUrl?: string
    requiredPermissions?: string[]
  }
}

/**
 * Business logic error details
 */
export interface BusinessError extends AppError {
  code: ErrorCode.WORKOUT_NOT_FOUND | ErrorCode.EXERCISE_ALREADY_COMPLETED | ErrorCode.SUBSCRIPTION_REQUIRED | ErrorCode.FEATURE_NOT_AVAILABLE
  
  /** Business-specific context */
  details?: {
    workoutId?: string
    exerciseId?: string
    requiredTier?: string
    featureName?: string
  }
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean
  
  /** Result data if successful */
  data?: T
  
  /** Error details if failed */
  error?: AppError
  
  /** Whether a recovery action was attempted */
  recoveryAttempted?: boolean
}

/**
 * Error handler function type
 */
export type ErrorHandler<T = unknown> = (error: unknown, context: string) => ErrorHandlingResult<T>

/**
 * Error reporting interface for logging/monitoring services
 */
export interface ErrorReport {
  /** The application error */
  error: AppError
  
  /** User context when error occurred */
  userContext?: {
    userId?: string
    sessionId?: string
    subscriptionTier?: string
    route?: string
  }
  
  /** Device and browser information */
  deviceContext?: {
    userAgent?: string
    viewport?: string
    connectionType?: string
    online?: boolean
  }
  
  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>
}

/**
 * Type guard functions for error types
 */
export const isValidationError = (error: AppError): error is ValidationError => {
  return [
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.INVALID_INPUT,
    ErrorCode.REQUIRED_FIELD,
    ErrorCode.INVALID_FORMAT
  ].includes(error.code)
}

export const isNetworkError = (error: AppError): error is NetworkError => {
  return [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.CONNECTION_TIMEOUT,
    ErrorCode.OFFLINE
  ].includes(error.code)
}

export const isAuthError = (error: AppError): error is AuthError => {
  return [
    ErrorCode.AUTH_ERROR,
    ErrorCode.PERMISSION_DENIED,
    ErrorCode.SESSION_EXPIRED,
    ErrorCode.UNAUTHORIZED
  ].includes(error.code)
}

export const isBusinessError = (error: AppError): error is BusinessError => {
  return [
    ErrorCode.WORKOUT_NOT_FOUND,
    ErrorCode.EXERCISE_ALREADY_COMPLETED,
    ErrorCode.SUBSCRIPTION_REQUIRED,
    ErrorCode.FEATURE_NOT_AVAILABLE
  ].includes(error.code)
}

/**
 * Default error messages for each error code
 */
export const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, { message: string; userMessage: string; severity: ErrorSeverity }> = {
  // Network errors
  [ErrorCode.NETWORK_ERROR]: {
    message: 'Network request failed',
    userMessage: 'Network error. Please check your internet connection.',
    severity: 'high'
  },
  [ErrorCode.CONNECTION_TIMEOUT]: {
    message: 'Request timed out',
    userMessage: 'Request timed out. Please try again.',
    severity: 'medium'
  },
  [ErrorCode.OFFLINE]: {
    message: 'Device is offline',
    userMessage: 'You appear to be offline. Some features may not work.',
    severity: 'medium'
  },

  // Auth errors
  [ErrorCode.AUTH_ERROR]: {
    message: 'Authentication failed',
    userMessage: 'Sign in failed. Please try again.',
    severity: 'high'
  },
  [ErrorCode.PERMISSION_DENIED]: {
    message: 'Permission denied',
    userMessage: 'Permission denied. Please sign out and back in.',
    severity: 'high'
  },
  [ErrorCode.SESSION_EXPIRED]: {
    message: 'Session expired',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'medium'
  },
  [ErrorCode.UNAUTHORIZED]: {
    message: 'Unauthorized access',
    userMessage: 'You are not authorized to access this feature.',
    severity: 'medium'
  },

  // Database errors
  [ErrorCode.DATABASE_ERROR]: {
    message: 'Database operation failed',
    userMessage: 'Something went wrong. Please try again.',
    severity: 'high'
  },
  [ErrorCode.NOT_FOUND]: {
    message: 'Resource not found',
    userMessage: 'Data not found.',
    severity: 'low'
  },
  [ErrorCode.DUPLICATE_ENTRY]: {
    message: 'Duplicate entry',
    userMessage: 'This data has already been saved.',
    severity: 'low'
  },
  [ErrorCode.CONSTRAINT_VIOLATION]: {
    message: 'Data constraint violation',
    userMessage: 'Invalid data. Please check your input.',
    severity: 'medium'
  },

  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: {
    message: 'Validation failed',
    userMessage: 'Please check your input and try again.',
    severity: 'low'
  },
  [ErrorCode.INVALID_INPUT]: {
    message: 'Invalid input provided',
    userMessage: 'Invalid input. Please check your data.',
    severity: 'low'
  },
  [ErrorCode.REQUIRED_FIELD]: {
    message: 'Required field missing',
    userMessage: 'Please fill in all required fields.',
    severity: 'low'
  },
  [ErrorCode.INVALID_FORMAT]: {
    message: 'Invalid data format',
    userMessage: 'Invalid format. Please check your input.',
    severity: 'low'
  },

  // Business errors
  [ErrorCode.WORKOUT_NOT_FOUND]: {
    message: 'Workout not found',
    userMessage: 'Workout not found. Please refresh the page.',
    severity: 'medium'
  },
  [ErrorCode.EXERCISE_ALREADY_COMPLETED]: {
    message: 'Exercise already completed',
    userMessage: 'This exercise has already been completed today.',
    severity: 'low'
  },
  [ErrorCode.SUBSCRIPTION_REQUIRED]: {
    message: 'Feature requires subscription',
    userMessage: 'This feature requires a premium subscription.',
    severity: 'low'
  },
  [ErrorCode.FEATURE_NOT_AVAILABLE]: {
    message: 'Feature not available',
    userMessage: 'This feature is not available in your plan.',
    severity: 'low'
  },

  // System errors
  [ErrorCode.UNKNOWN_ERROR]: {
    message: 'Unknown error occurred',
    userMessage: 'Something unexpected happened. Please try again.',
    severity: 'medium'
  },
  [ErrorCode.CONFIGURATION_ERROR]: {
    message: 'Configuration error',
    userMessage: 'System configuration error. Please contact support.',
    severity: 'critical'
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    message: 'Service unavailable',
    userMessage: 'Service temporarily unavailable. Please try again later.',
    severity: 'high'
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    message: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please wait a moment and try again.',
    severity: 'medium'
  }
}