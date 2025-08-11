/**
 * Base Service Class
 * 
 * Abstract base class that provides consistent patterns for all services in the X3 Tracker application.
 * Implements standardized error handling, logging, and operation patterns.
 * 
 * All domain services should extend this class to ensure consistency.
 */

import { AppError, ErrorCode } from '@/types/errors'
import { ErrorHandlingService } from '@/utils/error-handler'

export interface ServiceOperation<T> {
  data: T | null
  error: AppError | null
  success: boolean
}

export interface ServiceOptions {
  timeout?: number
  retries?: number
  logEnabled?: boolean
}

export abstract class BaseService {
  protected abstract readonly serviceName: string
  protected readonly options: ServiceOptions

  constructor(options: ServiceOptions = {}) {
    this.options = {
      timeout: 10000,
      retries: 3,
      logEnabled: true,
      ...options
    }
  }

  /**
   * Safe execution wrapper for all service operations
   * Provides consistent error handling and logging across all services
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, unknown>
  ): Promise<ServiceOperation<T>> {
    const startTime = Date.now()
    const operationContext = `${this.serviceName}.${operationName}`
    
    try {
      this.log(`Starting ${operationName}`, context)
      
      const data = await this.withTimeout(operation(), this.options.timeout!)
      const duration = Date.now() - startTime
      
      this.log(`${operationName} completed successfully`, { duration, context })
      
      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const appError = ErrorHandlingService.handleError(error, operationContext)
      
      this.log(`${operationName} failed`, { 
        duration, 
        error: appError.message, 
        context 
      })
      
      return {
        data: null,
        error: appError,
        success: false
      }
    }
  }

  /**
   * Execute operation with automatic retry logic
   * Useful for network operations that may fail temporarily
   */
  protected async safeExecuteWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, unknown>,
    customRetries?: number
  ): Promise<ServiceOperation<T>> {
    const maxRetries = customRetries ?? this.options.retries!
    let lastError: AppError | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.log(`${operationName} attempt ${attempt}/${maxRetries}`, context)
      
      const result = await this.safeExecute(operation, operationName, {
        ...context,
        attempt
      })

      if (result.success) {
        if (attempt > 1) {
          this.log(`${operationName} succeeded after ${attempt} attempts`)
        }
        return result
      }

      lastError = result.error
      
      // Don't retry on certain error types
      if (lastError && this.shouldNotRetry(lastError.code)) {
        this.log(`${operationName} failed with non-retryable error: ${lastError.code}`)
        break
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        this.log(`Waiting ${delay}ms before retry`)
        await this.delay(delay)
      }
    }

    return {
      data: null,
      error: lastError || this.createGenericError('Operation failed after retries', operationName),
      success: false
    }
  }

  /**
   * Validate operation input parameters
   * Override in child classes for specific validation logic
   */
  protected validateInput<T>(input: T, validationRules: ValidationRule<T>[]): AppError | null {
    for (const rule of validationRules) {
      const result = rule.validate(input)
      if (!result.isValid) {
        return {
          code: ErrorCode.VALIDATION_ERROR,
          message: `Validation failed: ${rule.name}`,
          userMessage: result.message || 'Invalid input provided',
          severity: 'low',
          timestamp: new Date().toISOString(),
          context: `${this.serviceName}.validateInput`,
          details: {
            metadata: {
              rule: rule.name,
              input: rule.includeInputInError ? input : '[hidden]'
            }
          }
        }
      }
    }
    return null
  }

  /**
   * Transform service data for different contexts
   * Override in child classes for specific transformations
   */
  protected transform<TInput, TOutput>(
    input: TInput,
    transformer: (input: TInput) => TOutput
  ): TOutput {
    try {
      return transformer(input)
    } catch (error) {
      this.log('Data transformation failed', { error, input: typeof input })
      throw this.createGenericError('Data transformation failed', 'transform')
    }
  }

  /**
   * Cache operation results (simple in-memory cache)
   * Override in child classes for more sophisticated caching
   */
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

  protected async cached<T>(
    cacheKey: string,
    operation: () => Promise<T>,
    ttlMs: number = 300000 // 5 minutes default
  ): Promise<T> {
    const cached = this.cache.get(cacheKey)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < cached.ttl) {
      this.log(`Cache hit for ${cacheKey}`)
      return cached.data as T
    }

    this.log(`Cache miss for ${cacheKey}, executing operation`)
    const data = await operation()
    
    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      ttl: ttlMs
    })

    // Clean up expired cache entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache()
    }

    return data
  }

  /**
   * Clear cache entries (useful for invalidation)
   */
  protected clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * Logging utility with consistent format
   */
  protected log(message: string, data?: unknown): void {
    if (!this.options.logEnabled) return

    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.serviceName}] ${message}`

    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
  }

  /**
   * Create generic service error
   */
  protected createGenericError(message: string, operation: string): AppError {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message,
      userMessage: 'Something went wrong. Please try again.',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context: `${this.serviceName}.${operation}`
    }
  }

  /**
   * Utility methods
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private shouldNotRetry(errorCode: ErrorCode): boolean {
    return [
      ErrorCode.PERMISSION_DENIED,
      ErrorCode.UNAUTHORIZED,
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.INVALID_INPUT,
      ErrorCode.SUBSCRIPTION_REQUIRED,
      ErrorCode.FEATURE_NOT_AVAILABLE
    ].includes(errorCode)
  }

  private cleanupCache(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.log(`Cleaned up ${cleaned} expired cache entries`)
    }
  }

  /**
   * Get service health/status information
   */
  public getServiceInfo() {
    return {
      name: this.serviceName,
      cacheSize: this.cache.size,
      options: this.options,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Validation rule interface
 */
export interface ValidationRule<T> {
  name: string
  validate: (input: T) => ValidationResult
  includeInputInError?: boolean
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}

/**
 * Common validation rules
 */
export const CommonValidationRules = {
  required: <T>(fieldName: string): ValidationRule<T> => ({
    name: `${fieldName}_required`,
    validate: (input: T) => ({
      isValid: input != null && input !== '' && input !== undefined,
      message: `${fieldName} is required`
    })
  }),

  nonEmpty: <T extends string | Array<unknown>>(fieldName: string): ValidationRule<T> => ({
    name: `${fieldName}_non_empty`,
    validate: (input: T) => ({
      isValid: input != null && input.length > 0,
      message: `${fieldName} cannot be empty`
    })
  }),

  validUserId: (): ValidationRule<string> => ({
    name: 'valid_user_id',
    validate: (input: string) => ({
      isValid: typeof input === 'string' && input.length > 0,
      message: 'Valid user ID is required'
    })
  }),

  validEnum: <T extends string>(fieldName: string, validValues: T[]): ValidationRule<string> => ({
    name: `${fieldName}_valid_enum`,
    validate: (input: string) => ({
      isValid: validValues.includes(input as T),
      message: `${fieldName} must be one of: ${validValues.join(', ')}`
    })
  })
}

/**
 * Service registry for dependency injection
 */
export class ServiceRegistry {
  private static services = new Map<string, BaseService>()

  static register<T extends BaseService>(key: string, service: T): void {
    this.services.set(key, service)
  }

  static get<T extends BaseService>(key: string): T {
    const service = this.services.get(key)
    if (!service) {
      throw new Error(`Service '${key}' not found in registry`)
    }
    return service as T
  }

  static has(key: string): boolean {
    return this.services.has(key)
  }

  static list(): string[] {
    return Array.from(this.services.keys())
  }

  static getServiceInfo(key: string) {
    const service = this.get(key)
    return service.getServiceInfo()
  }

  static getAllServiceInfo() {
    const info: Record<string, unknown> = {}
    for (const [key, service] of this.services) {
      info[key] = service.getServiceInfo()
    }
    return info
  }
}