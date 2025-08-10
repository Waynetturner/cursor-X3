/**
 * Centralized Error Handling Service
 * 
 * Provides consistent error handling patterns across the entire X3 Tracker application.
 * Converts technical errors into user-friendly messages and provides recovery actions.
 * 
 * Usage:
 * - Use ErrorHandlingService.handleError() for consistent error processing
 * - Use ErrorHandlingService.createUserFriendlyError() for UI display
 * - Use ErrorHandlingService.reportError() for logging/monitoring
 */

import { 
  AppError, 
  ErrorCode, 
  ErrorSeverity,
  DEFAULT_ERROR_MESSAGES,
  RecoveryAction,
  ErrorReport,
  ValidationError,
  NetworkError,
  AuthError,
  BusinessError
} from '@/types/errors'
import { announceToScreenReader } from '@/lib/accessibility'

export class ErrorHandlingService {
  /**
   * Convert any error into a standardized AppError
   * Central error processing for consistent handling
   */
  static handleError(error: unknown, context: string): AppError {
    console.error(`[ErrorHandler] ${context}:`, error)

    // If it's already an AppError, just update context
    if (this.isAppError(error)) {
      return {
        ...error,
        context,
        timestamp: error.timestamp || new Date().toISOString()
      }
    }

    // Handle different error types
    if (error instanceof Error) {
      return this.handleJavaScriptError(error, context)
    }

    if (this.isSupabaseError(error)) {
      return this.handleSupabaseError(error, context)
    }

    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, context)
    }

    // Default unknown error
    return this.createDefaultError(error, context)
  }

  /**
   * Create user-friendly error with recovery actions
   * Used in UI components for consistent error display
   */
  static createUserFriendlyError(error: AppError, onRetry?: () => void): AppError & { recoveryActions: RecoveryAction[] } {
    const recoveryActions: RecoveryAction[] = []

    // Add appropriate recovery actions based on error type
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.CONNECTION_TIMEOUT:
        if (onRetry) {
          recoveryActions.push({
            action: 'retry',
            label: 'Try Again',
            handler: onRetry,
            primary: true
          })
        }
        recoveryActions.push({
          action: 'refresh',
          label: 'Refresh Page',
          handler: () => window.location.reload()
        })
        break

      case ErrorCode.SESSION_EXPIRED:
      case ErrorCode.AUTH_ERROR:
        recoveryActions.push({
          action: 'signin',
          label: 'Sign In Again',
          handler: () => window.location.href = '/auth/signin',
          primary: true
        })
        break

      case ErrorCode.SUBSCRIPTION_REQUIRED:
      case ErrorCode.FEATURE_NOT_AVAILABLE:
        recoveryActions.push({
          action: 'upgrade',
          label: 'Upgrade Plan',
          handler: () => window.location.href = '/settings',
          primary: true
        })
        break

      case ErrorCode.SERVICE_UNAVAILABLE:
      case ErrorCode.DATABASE_ERROR:
        if (onRetry) {
          recoveryActions.push({
            action: 'retry',
            label: 'Try Again',
            handler: onRetry,
            primary: true
          })
        }
        break

      case ErrorCode.CONFIGURATION_ERROR:
      case ErrorCode.UNKNOWN_ERROR:
        if (error.severity === 'critical' || error.severity === 'high') {
          recoveryActions.push({
            action: 'contact_support',
            label: 'Contact Support',
            handler: () => window.open('mailto:support@x3momentum.com', '_blank')
          })
        }
        break

      default:
        if (onRetry) {
          recoveryActions.push({
            action: 'retry',
            label: 'Try Again',
            handler: onRetry
          })
        }
        break
    }

    return {
      ...error,
      recoveryActions
    }
  }

  /**
   * Show error to user with accessibility support
   * Provides consistent user feedback across the application
   */
  static showErrorToUser(error: AppError, options?: {
    announceToScreenReader?: boolean
    duration?: number
  }): void {
    const { announceToScreenReader: announce = true, duration = 5000 } = options || {}

    // Announce to screen readers for accessibility
    if (announce) {
      announceToScreenReader(error.userMessage, 'assertive')
    }

    // In a real application, this would integrate with a toast/notification system
    console.error('User Error:', error.userMessage)
    
    // Log full error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Details')
      console.log('Code:', error.code)
      console.log('Message:', error.message)
      console.log('Context:', error.context)
      console.log('Details:', error.details)
      console.groupEnd()
    }
  }

  /**
   * Report error for monitoring/logging
   * Used for error tracking in production
   */
  static reportError(error: AppError, userContext?: ErrorReport['userContext']): void {
    const report: ErrorReport = {
      error,
      userContext,
      deviceContext: this.getDeviceContext(),
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    }

    // In production, this would send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      console.log('Error Report:', report)
    } else {
      console.warn('Error Report (Development):', report)
    }
  }

  /**
   * Create validation error with field-specific details
   */
  static createValidationError(
    fieldErrors: Record<string, string[]>,
    context: string
  ): ValidationError {
    const fieldCount = Object.keys(fieldErrors).length
    const totalErrors = Object.values(fieldErrors).reduce((sum, errors) => sum + errors.length, 0)

    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: `Validation failed for ${fieldCount} field(s)`,
      userMessage: `Please fix ${totalErrors} validation error(s) and try again.`,
      severity: 'low',
      timestamp: new Date().toISOString(),
      context,
      fieldErrors,
      details: {
        fieldCount,
        totalErrors
      }
    }
  }

  /**
   * Create business logic error with specific context
   */
  static createBusinessError(
    code: ErrorCode,
    message: string,
    context: string,
    details?: Record<string, unknown>
  ): BusinessError {
    const defaultMessage = DEFAULT_ERROR_MESSAGES[code]

    return {
      code,
      message,
      userMessage: defaultMessage.userMessage,
      severity: defaultMessage.severity,
      timestamp: new Date().toISOString(),
      context,
      details
    } as BusinessError
  }

  /**
   * Handle JavaScript errors (TypeError, ReferenceError, etc.)
   */
  private static handleJavaScriptError(error: Error, context: string): AppError {
    let code = ErrorCode.UNKNOWN_ERROR
    let severity: ErrorSeverity = 'medium'

    // Classify JavaScript errors
    if (error instanceof TypeError) {
      code = ErrorCode.CONFIGURATION_ERROR
      severity = 'high'
    } else if (error instanceof ReferenceError) {
      code = ErrorCode.CONFIGURATION_ERROR
      severity = 'high'
    } else if (error.message.includes('Network')) {
      code = ErrorCode.NETWORK_ERROR
      severity = 'high'
    }

    return {
      code,
      message: error.message,
      userMessage: DEFAULT_ERROR_MESSAGES[code].userMessage,
      severity,
      timestamp: new Date().toISOString(),
      context,
      details: {
        originalError: error,
        stack: error.stack,
        name: error.name
      }
    }
  }

  /**
   * Handle Supabase-specific errors
   */
  private static handleSupabaseError(error: any, context: string): AppError {
    let code = ErrorCode.DATABASE_ERROR
    let severity: ErrorSeverity = 'medium'

    // Map Supabase error codes
    switch (error.code) {
      case 'PGRST116':
        code = ErrorCode.NOT_FOUND
        severity = 'low'
        break
      case 'PGRST301':
        code = ErrorCode.PERMISSION_DENIED
        severity = 'high'
        break
      case '23505': // PostgreSQL unique violation
        code = ErrorCode.DUPLICATE_ENTRY
        severity = 'low'
        break
      case '23503': // PostgreSQL foreign key violation
        code = ErrorCode.CONSTRAINT_VIOLATION
        severity = 'medium'
        break
      default:
        if (error.message?.includes('JWT')) {
          code = ErrorCode.SESSION_EXPIRED
          severity = 'medium'
        }
        break
    }

    return {
      code,
      message: error.message || 'Database error',
      userMessage: DEFAULT_ERROR_MESSAGES[code].userMessage,
      severity,
      timestamp: new Date().toISOString(),
      context,
      details: {
        originalError: error,
        supabaseCode: error.code,
        hint: error.hint,
        details: error.details
      }
    }
  }

  /**
   * Handle network errors (fetch, axios, etc.)
   */
  private static handleNetworkError(error: any, context: string): NetworkError {
    let code = ErrorCode.NETWORK_ERROR
    let severity: ErrorSeverity = 'high'

    // Classify network errors
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      code = ErrorCode.OFFLINE
      severity = 'medium'
    } else if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      code = ErrorCode.CONNECTION_TIMEOUT
      severity = 'medium'
    }

    return {
      code,
      message: error.message || 'Network error',
      userMessage: DEFAULT_ERROR_MESSAGES[code].userMessage,
      severity,
      timestamp: new Date().toISOString(),
      context,
      details: {
        originalError: error,
        url: error.config?.url,
        method: error.config?.method,
        statusCode: error.response?.status,
        responseText: error.response?.statusText
      }
    }
  }

  /**
   * Create default error for unknown error types
   */
  private static createDefaultError(error: unknown, context: string): AppError {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error?.toString() || 'Unknown error',
      userMessage: DEFAULT_ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR].userMessage,
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context,
      details: {
        originalError: error,
        type: typeof error
      }
    }
  }

  /**
   * Type guards and utility functions
   */
  private static isAppError(error: unknown): error is AppError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error
  }

  private static isSupabaseError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 
           ('code' in error || 'hint' in error || 'details' in error)
  }

  private static isNetworkError(error: unknown): boolean {
    return typeof error === 'object' && error !== null &&
           ('status' in error || 'response' in error || 'config' in error)
  }

  private static getDeviceContext() {
    return {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      online: navigator.onLine
    }
  }
}

/**
 * Convenience functions for common error handling patterns
 */

/**
 * Async wrapper that automatically handles errors
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string,
  onError?: (error: AppError) => void
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const appError = ErrorHandlingService.handleError(error, context)
    
    if (onError) {
      onError(appError)
    } else {
      ErrorHandlingService.showErrorToUser(appError)
    }
    
    return { data: null, error: appError }
  }
}

/**
 * React error boundary helper
 */
export function createErrorBoundaryHandler(context: string) {
  return (error: Error, errorInfo: { componentStack: string }) => {
    const appError = ErrorHandlingService.handleError(error, context)
    ErrorHandlingService.reportError(appError, {
      route: window.location.pathname,
      metadata: { componentStack: errorInfo.componentStack }
    })
  }
}

/**
 * Export for convenient access
 */
export const {
  handleError,
  createUserFriendlyError,
  showErrorToUser,
  reportError,
  createValidationError,
  createBusinessError
} = ErrorHandlingService