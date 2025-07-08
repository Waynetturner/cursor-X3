// Backend Integration Configuration
// This file documents the required environment variables and backend setup

export const BACKEND_CONFIG = {
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // AI API Configuration (for Mastery tier)
  ai: {
    openai: {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    },
    anthropic: {
      apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    },
  },
  
  // N8N Integration (for OpenAI coaching)
  n8n: {
    webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,
  },
}

// Required Environment Variables:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
// NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
// NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
// SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

export const DATABASE_SCHEMA = {
  // workout_exercises table
  workout_exercises: {
    id: 'uuid (primary key)',
    user_id: 'uuid (foreign key to auth.users)',
    workout_local_date_time: 'timestamp with time zone',
    workout_type: 'text (Push|Pull)',
    week_number: 'integer',
    exercise_name: 'text',
    band_color: 'text (White|Light Gray|Dark Gray|Black|Elite)',
    full_reps: 'integer',
    partial_reps: 'integer',
    notes: 'text',
    created_at: 'timestamp with time zone (default: now())',
  },
  
  // profiles table
  profiles: {
    id: 'uuid (primary key, references auth.users)',
    x3_start_date: 'date',
    fitness_level: 'text (beginner|intermediate|advanced)',
    subscription_tier: 'text (foundation|momentum|mastery)',
    created_at: 'timestamp with time zone (default: now())',
    updated_at: 'timestamp with time zone (default: now())',
  },
  
  // user_ui_settings table
  user_ui_settings: {
    id: 'uuid (primary key)',
    user_id: 'uuid (foreign key to auth.users)',
    theme: 'text (light|dark|auto)',
    tts_enabled: 'boolean (default: true)',
    rest_timer_enabled: 'boolean (default: true)',
    cadence_enabled: 'boolean (default: true)',
    created_at: 'timestamp with time zone (default: now())',
    updated_at: 'timestamp with time zone (default: now())',
  },
}

export const RLS_POLICIES = {
  // workout_exercises RLS policies
  workout_exercises: {
    select: 'Users can only select their own workout data',
    insert: 'Users can only insert their own workout data',
    update: 'Users can only update their own workout data',
    delete: 'Users can only delete their own workout data',
  },
  
  // profiles RLS policies
  profiles: {
    select: 'Users can only select their own profile',
    insert: 'Users can only insert their own profile',
    update: 'Users can only update their own profile',
    delete: 'Users cannot delete their profile',
  },
  
  // user_ui_settings RLS policies
  user_ui_settings: {
    select: 'Users can only select their own UI settings',
    insert: 'Users can only insert their own UI settings',
    update: 'Users can only update their own UI settings',
    delete: 'Users can only delete their own UI settings',
  },
} 