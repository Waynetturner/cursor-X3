export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_responses: {
        Row: {
          confidence_score: number | null
          context_data: Json | null
          created_at: string | null
          id: number
          metadata: Json | null
          n8n_workflow_id: string | null
          query: string
          response: string
          source_type: string | null
          sources: Json | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          context_data?: Json | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
          n8n_workflow_id?: string | null
          query: string
          response: string
          source_type?: string | null
          sources?: Json | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          context_data?: Json | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
          n8n_workflow_id?: string | null
          query?: string
          response?: string
          source_type?: string | null
          sources?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          coach_response: string
          created_at: string | null
          id: number
          model_used: string | null
          tokens_used: number | null
          user_id: string
          user_message: string
        }
        Insert: {
          coach_response: string
          created_at?: string | null
          id?: number
          model_used?: string | null
          tokens_used?: number | null
          user_id: string
          user_message: string
        }
        Update: {
          coach_response?: string
          created_at?: string | null
          id?: number
          model_used?: string | null
          tokens_used?: number | null
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      coach_conversations_backup: {
        Row: {
          created_at: string | null
          id: string | null
          message: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          message?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          message?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string | null
          id: string
          stripe_session_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          id?: string
          stripe_session_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          id?: string
          stripe_session_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_tiers: string[] | null
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_tiers?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_tiers?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          band_color: string
          created_at: string | null
          exercise_name: string
          full_reps: number
          id: number
          notes: string | null
          partial_reps: number | null
          user_id: string | null
          workout_id: number | null
        }
        Insert: {
          band_color: string
          created_at?: string | null
          exercise_name: string
          full_reps: number
          id?: number
          notes?: string | null
          partial_reps?: number | null
          user_id?: string | null
          workout_id?: number | null
        }
        Update: {
          band_color?: string
          created_at?: string | null
          exercise_name?: string
          full_reps?: number
          id?: number
          notes?: string | null
          partial_reps?: number | null
          user_id?: string | null
          workout_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_backup_pre_text_conversion: {
        Row: {
          created_at: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_demographics: {
        Row: {
          age: number | null
          available_equipment: string | null
          coach_tone: string | null
          created_at: string
          fitness_level: string | null
          gender: string | null
          goals: string | null
          id: string
          injury_history: string | null
          language: string | null
          location: string | null
          motivation_type: string | null
          preferred_days: string[] | null
          session_length: string | null
          timezone: string | null
          track_metrics: boolean | null
          updated_at: string
          user_id: string
          x3_program: string | null
        }
        Insert: {
          age?: number | null
          available_equipment?: string | null
          coach_tone?: string | null
          created_at?: string
          fitness_level?: string | null
          gender?: string | null
          goals?: string | null
          id?: string
          injury_history?: string | null
          language?: string | null
          location?: string | null
          motivation_type?: string | null
          preferred_days?: string[] | null
          session_length?: string | null
          timezone?: string | null
          track_metrics?: boolean | null
          updated_at?: string
          user_id: string
          x3_program?: string | null
        }
        Update: {
          age?: number | null
          available_equipment?: string | null
          coach_tone?: string | null
          created_at?: string
          fitness_level?: string | null
          gender?: string | null
          goals?: string | null
          id?: string
          injury_history?: string | null
          language?: string | null
          location?: string | null
          motivation_type?: string | null
          preferred_days?: string[] | null
          session_length?: string | null
          timezone?: string | null
          track_metrics?: boolean | null
          updated_at?: string
          user_id?: string
          x3_program?: string | null
        }
        Relationships: []
      }
      user_ui_settings: {
        Row: {
          audio_notifications_enabled: boolean | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          voice_preference: string | null
          workout_history_default: string | null
        }
        Insert: {
          audio_notifications_enabled?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          voice_preference?: string | null
          workout_history_default?: string | null
        }
        Update: {
          audio_notifications_enabled?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          voice_preference?: string | null
          workout_history_default?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string | null
          date: string
          id: number
          user_id: string | null
          week_number: number
          workout_type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: number
          user_id?: string | null
          week_number: number
          workout_type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: number
          user_id?: string | null
          week_number?: number
          workout_type?: string
        }
        Relationships: []
      }
      workouts_backup: {
        Row: {
          created_at: string | null
          date: string | null
          id: number | null
          user_id: string | null
          week_number: number | null
          workout_type: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: number | null
          user_id?: string | null
          week_number?: number | null
          workout_type?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: number | null
          user_id?: string | null
          week_number?: number | null
          workout_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_and_data: {
        Args: { target_email: string }
        Returns: Json
      }
      get_user_demographics: {
        Args: { p_user_id: string }
        Returns: {
          age: number
          gender: string
          location: string
          fitness_level: string
          x3_program: string
          goals: string
          injury_history: string
        }[]
      }
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      search_similar_queries: {
        Args: { p_user_id: string; p_query: string; p_limit?: number }
        Returns: {
          id: number
          query: string
          response: string
          source_type: string
          confidence_score: number
          created_at: string
        }[]
      }
      upsert_user_demographics: {
        Args: {
          p_user_id: string
          p_age?: number
          p_gender?: string
          p_location?: string
          p_fitness_level?: string
          p_x3_program?: string
          p_goals?: string
          p_injury_history?: string
        }
        Returns: undefined
      }
      validate_coupon: {
        Args: { p_coupon_code: string; p_user_id?: string; p_tier?: string }
        Returns: {
          valid: boolean
          coupon_id: string
          discount_type: string
          discount_value: number
          message: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
