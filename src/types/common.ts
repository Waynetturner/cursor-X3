// Common type definitions for the X3 Tracker application
// This file contains shared interfaces to replace 'any' types

// Generic API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

// Event handler types
export interface SelectChangeEvent {
  target: {
    value: string;
    name?: string;
  };
}

export interface FormEvent {
  preventDefault: () => void;
}

// Backend service types
export interface BackendResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface BackendError {
  message: string;
  code?: string;
  status?: number;
}

// TTS related types
export interface TTSVoice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface TTSSettings {
  enabled: boolean;
  voice: TTSVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

// WebLLM types
export interface WebLLMConfig {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface CoachingContext {
  userProfile?: {
    experience?: string;
    preferences?: Record<string, unknown>;
  };
  currentWorkout?: {
    type: string;
    week: number;
    exercises?: string[];
  };
  conversationHistory?: ChatMessage[];
}

// N8N Integration types
export interface N8NWebhookData {
  workoutData?: unknown;
  userData?: unknown;
  timestamp: string;
}

export interface N8NResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

// Test mode types
export interface TestModeConfig {
  enabled: boolean;
  mockData?: Record<string, unknown>;
  skipValidation?: boolean;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  isLoading: boolean;
  loadingText?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: ValidationError[];
  isDirty: boolean;
}

// Settings types
export interface UserSettings {
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
}

// Audio cues types
export interface AudioCue {
  type: 'start' | 'stop' | 'rest' | 'warning';
  sound: string;
  enabled: boolean;
}

// Exercise grid types
export interface ExerciseGridConfig {
  columns: number;
  spacing: number;
  showLabels: boolean;
}

// Workout card types
export interface WorkoutCardData {
  id: string;
  date: string;
  type: string;
  exercises: number;
  duration?: number;
  notes?: string;
}

// Generic function types
export type EventHandler<T = unknown> = (data: T) => void;
export type AsyncEventHandler<T = unknown> = (data: T) => Promise<void>;
export type VoidCallback = () => void;
export type AsyncVoidCallback = () => Promise<void>;

// Database query types
export interface QueryParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at?: string;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: VoidCallback;
}