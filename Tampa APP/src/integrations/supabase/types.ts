export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      certifications: {
        Row: {
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          message: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          message: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          message?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          area: string
          check_type: string
          checked_at: string
          checked_by: string
          corrective_action: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          resolved_at: string | null
          status: string
          temperature_reading: number | null
        }
        Insert: {
          area: string
          check_type: string
          checked_at?: string
          checked_by: string
          corrective_action?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          resolved_at?: string | null
          status?: string
          temperature_reading?: number | null
        }
        Update: {
          area?: string
          check_type?: string
          checked_at?: string
          checked_by?: string
          corrective_action?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          resolved_at?: string | null
          status?: string
          temperature_reading?: number | null
        }
        Relationships: []
      }
      daily_routines: {
        Row: {
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          created_by: string
          description: string | null
          frequency: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          created_by: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          created_by?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      label_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      measuring_units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          organization_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          organization_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          organization_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      prep_sessions: {
        Row: {
          actual_prep_minutes: number | null
          batch_size: number | null
          completed_at: string | null
          created_at: string
          id: string
          organization_id: string | null
          recipe_id: string
          staff_id: string
          started_at: string
          updated_at: string
        }
        Insert: {
          actual_prep_minutes?: number | null
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          recipe_id: string
          staff_id: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          actual_prep_minutes?: number | null
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          recipe_id?: string
          staff_id?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      prepared_items: {
        Row: {
          batch_size: number | null
          created_at: string
          expires_at: string
          id: string
          label_count: number | null
          organization_id: string | null
          prep_session_id: string | null
          prepared_at: string
          prepared_by: string
          recipe_id: string
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          batch_size?: number | null
          created_at?: string
          expires_at: string
          id?: string
          label_count?: number | null
          organization_id?: string | null
          prep_session_id?: string | null
          prepared_at?: string
          prepared_by: string
          recipe_id: string
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_size?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          label_count?: number | null
          organization_id?: string | null
          prep_session_id?: string | null
          prepared_at?: string
          prepared_by?: string
          recipe_id?: string
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prepared_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      production_metrics: {
        Row: {
          actual_time_minutes: number
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          planned_time_minutes: number | null
          prep_session_id: string | null
          quality_rating: number | null
          quantity_produced: number
          recipe_id: string | null
          recorded_at: string
          recorded_by: string
          staff_count: number | null
        }
        Insert: {
          actual_time_minutes: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          planned_time_minutes?: number | null
          prep_session_id?: string | null
          quality_rating?: number | null
          quantity_produced: number
          recipe_id?: string | null
          recorded_at?: string
          recorded_by: string
          staff_count?: number | null
        }
        Update: {
          actual_time_minutes?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          planned_time_minutes?: number | null
          prep_session_id?: string | null
          quality_rating?: number | null
          quantity_produced?: number
          recipe_id?: string | null
          recorded_at?: string
          recorded_by?: string
          staff_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_metrics_prep_session_id_fkey"
            columns: ["prep_session_id"]
            isOneToOne: false
            referencedRelation: "prep_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_metrics_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          measuring_unit_id: string | null
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          measuring_unit_id?: string | null
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          measuring_unit_id?: string | null
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "label_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_measuring_unit_id_fkey"
            columns: ["measuring_unit_id"]
            isOneToOne: false
            referencedRelation: "measuring_units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          display_name: string | null
          hire_date: string | null
          id: string
          location_id: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          hire_date?: string | null
          id?: string
          location_id?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          hire_date?: string | null
          id?: string
          location_id?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergens: string[] | null
          category: string | null
          created_at: string
          created_by: string
          dietary_requirements: string[] | null
          estimated_prep_minutes: number | null
          hold_time_days: number | null
          id: string
          ingredients: Json
          name: string
          organization_id: string | null
          prep_steps: Json
          service_gap_minutes: number | null
          updated_at: string
          yield_amount: number
          yield_unit: string
        }
        Insert: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string
          created_by: string
          dietary_requirements?: string[] | null
          estimated_prep_minutes?: number | null
          hold_time_days?: number | null
          id?: string
          ingredients?: Json
          name: string
          organization_id?: string | null
          prep_steps?: Json
          service_gap_minutes?: number | null
          updated_at?: string
          yield_amount: number
          yield_unit?: string
        }
        Update: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string
          created_by?: string
          dietary_requirements?: string[] | null
          estimated_prep_minutes?: number | null
          hold_time_days?: number | null
          id?: string
          ingredients?: Json
          name?: string
          organization_id?: string | null
          prep_steps?: Json
          service_gap_minutes?: number | null
          updated_at?: string
          yield_amount?: number
          yield_unit?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          id: string
          notes: string | null
          performed_at: string
          performed_by: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      routine_completions: {
        Row: {
          completed_at: string
          completed_by: string
          id: string
          notes: string | null
          routine_id: string
          task_statuses: Json | null
        }
        Insert: {
          completed_at?: string
          completed_by: string
          id?: string
          notes?: string | null
          routine_id: string
          task_statuses?: Json | null
        }
        Update: {
          completed_at?: string
          completed_by?: string
          id?: string
          notes?: string | null
          routine_id?: string
          task_statuses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_completions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "daily_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          routine_id: string
          task_name: string
          task_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          routine_id: string
          task_name: string
          task_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          routine_id?: string
          task_name?: string
          task_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_tasks_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "daily_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          organization_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          organization_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          organization_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waste_logs: {
        Row: {
          category: string | null
          created_at: string
          estimated_cost: number | null
          id: string
          item_name: string
          logged_at: string
          logged_by: string
          notes: string | null
          organization_id: string | null
          quantity: number
          reason: string
          unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          item_name: string
          logged_at?: string
          logged_by: string
          notes?: string | null
          organization_id?: string | null
          quantity: number
          reason: string
          unit: string
        }
        Update: {
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          item_name?: string
          logged_at?: string
          logged_by?: string
          notes?: string | null
          organization_id?: string | null
          quantity?: number
          reason?: string
          unit?: string
        }
        Relationships: []
      }
    }
    Views: {
      compliance_summary: {
        Row: {
          area: string | null
          check_type: string | null
          date: string | null
          failed_count: number | null
          needs_attention_count: number | null
          organization_id: string | null
          passed_count: number | null
          total_checks: number | null
        }
        Relationships: []
      }
      efficiency_analytics: {
        Row: {
          avg_quality: number | null
          organization_id: string | null
          production_count: number | null
          recipe_category: string | null
          recipe_name: string | null
          time_efficiency_ratio: number | null
          total_produced: number | null
        }
        Relationships: []
      }
      waste_analytics: {
        Row: {
          category: string | null
          date: string | null
          log_count: number | null
          organization_id: string | null
          reason: string | null
          total_cost: number | null
          total_quantity: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "leader_chef" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "leader_chef", "staff"],
    },
  },
} as const
