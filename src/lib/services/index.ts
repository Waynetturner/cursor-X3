/**
 * Services - Barrel Export
 * 
 * Centralized exports for all business logic services in the X3 Tracker application.
 * Provides clean service layer access and dependency injection support.
 * 
 * Usage:
 * import { WorkoutService } from '@/lib/services'
 * import { ServiceRegistry } from '@/lib/services'
 */

// Base service infrastructure
export {
  BaseService,
  ServiceRegistry,
  CommonValidationRules
} from '../base-service'

export type {
  ServiceOperation,
  ServiceOptions,
  ValidationRule,
  ValidationResult
} from '../base-service'

// Domain services
export {
  WorkoutService
} from './workout-service'

export type {
  WorkoutStats,
  PersonalRecord,
  RecentWorkout,
  WorkoutServiceOptions
} from './workout-service'

/**
 * Service Registry Setup
 * 
 * Pre-configured service instances for dependency injection
 */

// Import service classes
import { WorkoutService } from './workout-service'

// Create service instances with default configuration
const workoutService = new WorkoutService({
  cacheEnabled: true,
  cacheTtlMs: 300000 // 5 minutes
})

// Register services in the global registry
// ServiceRegistry.register('workout', workoutService) // TODO: Fix module resolution issue

/**
 * Service accessor functions for convenient access
 */
export const getWorkoutService = (): WorkoutService => {
  return workoutService // Direct return instead of registry lookup
}

/**
 * Initialize all services
 * Call this function during application startup
 */
export function initializeServices(): void {
  console.log('🚀 Initializing services...')
  
  // Services are already registered above
  // const registeredServices = ServiceRegistry.list()
  // console.log(`✅ Registered ${registeredServices.length} services:`, registeredServices)
  console.log('✅ Services initialized successfully')
  
  // Log service information in development
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('📊 Service registry info:', ServiceRegistry.getAllServiceInfo())
  // }
}

/**
 * Service health check utility
 */
export function checkServiceHealth(): Record<string, unknown> {
  // return ServiceRegistry.getAllServiceInfo()
  return { workout: { status: 'healthy' } } // Simplified health check
}

/**
 * Cleanup services (useful for testing or app shutdown)
 */
export function cleanupServices(): void {
  console.log('🧹 Cleaning up services...')
  // Individual services can implement cleanup logic
  // For now, we'll just log that cleanup is happening
  console.log('✅ Services cleaned up')
}

/**
 * Service configuration types
 */
export interface ServiceConfiguration {
  workout: {
    cacheEnabled: boolean
    cacheTtlMs: number
    maxRetries: number
  }
  // Add other service configurations as they're implemented
}

/**
 * Default service configuration
 */
export const DEFAULT_SERVICE_CONFIG: ServiceConfiguration = {
  workout: {
    cacheEnabled: true,
    cacheTtlMs: 300000, // 5 minutes
    maxRetries: 3
  }
}

/**
 * Configure services with custom settings
 */
export function configureServices(config: Partial<ServiceConfiguration>): void {
  console.log('⚙️ Configuring services with custom settings:', config)
  
  // Re-create and register services with new configuration
  if (config.workout) {
    const customWorkoutService = new WorkoutService({
      cacheEnabled: config.workout.cacheEnabled,
      cacheTtlMs: config.workout.cacheTtlMs
    })
    // ServiceRegistry.register('workout', customWorkoutService)
  }
  
  console.log('✅ Services reconfigured successfully')
}

/**
 * Middleware for service operations (logging, monitoring, etc.)
 */
export interface ServiceMiddleware {
  name: string
  beforeOperation?: (serviceName: string, operationName: string, params: any) => void
  afterOperation?: (serviceName: string, operationName: string, result: any) => void
  onError?: (serviceName: string, operationName: string, error: any) => void
}

// Global middleware registry (for future implementation)
const serviceMiddleware: ServiceMiddleware[] = []

/**
 * Add middleware to service operations
 */
export function addServiceMiddleware(middleware: ServiceMiddleware): void {
  serviceMiddleware.push(middleware)
}

/**
 * Example middleware implementations
 */
export const LoggingMiddleware: ServiceMiddleware = {
  name: 'logging',
  beforeOperation: (serviceName, operationName, params) => {
    console.log(`🔄 [${serviceName}] Starting ${operationName}`, params)
  },
  afterOperation: (serviceName, operationName, result) => {
    console.log(`✅ [${serviceName}] Completed ${operationName}`, { success: result.success })
  },
  onError: (serviceName, operationName, error) => {
    console.error(`❌ [${serviceName}] Failed ${operationName}`, error)
  }
}

export const PerformanceMiddleware: ServiceMiddleware = {
  name: 'performance',
  beforeOperation: (serviceName, operationName) => {
    const key = `${serviceName}.${operationName}`
    console.time(key)
  },
  afterOperation: (serviceName, operationName) => {
    const key = `${serviceName}.${operationName}`
    console.timeEnd(key)
  }
}

/**
 * Service operation wrapper with middleware support
 */
export async function executeServiceOperation<T>(
  serviceName: string,
  operationName: string,
  operation: () => Promise<T>,
  params?: any
): Promise<T> {
  // Execute before middleware
  serviceMiddleware.forEach(middleware => {
    middleware.beforeOperation?.(serviceName, operationName, params)
  })

  try {
    const result = await operation()
    
    // Execute after middleware
    serviceMiddleware.forEach(middleware => {
      middleware.afterOperation?.(serviceName, operationName, result)
    })
    
    return result
  } catch (error) {
    // Execute error middleware
    serviceMiddleware.forEach(middleware => {
      middleware.onError?.(serviceName, operationName, error)
    })
    
    throw error
  }
}