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
      budgets: {
        Row: {
          allocated_amount: number
          category_id: string
          created_at: string | null
          end_date: string
          id: string
          period: string
          spent_amount: number | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allocated_amount: number
          category_id: string
          created_at?: string | null
          end_date: string
          id?: string
          period: string
          spent_amount?: number | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allocated_amount?: number
          category_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          period?: string
          spent_amount?: number | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          keywords: string[] | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          category: string | null
          created_at: string | null
          creditor: string | null
          description: string
          due_date: string
          id: string
          paid_amount: number | null
          total_amount: number
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creditor?: string | null
          description: string
          due_date: string
          id?: string
          paid_amount?: number | null
          total_amount: number
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creditor?: string | null
          description?: string
          due_date?: string
          id?: string
          paid_amount?: number | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category_id: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          description: string | null
          goal_type: string | null
          id: string
          target_amount: number
          title: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          goal_type?: string | null
          id?: string
          target_amount: number
          title: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          goal_type?: string | null
          id?: string
          target_amount?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line_2: string | null
          address_type: Database["public"]["Enums"]["address_type_enum"] | null
          avatar_url: string | null
          budget_alerts_enabled: boolean | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          date_of_birth: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          goals_progress_enabled: boolean | null
          id: string
          monthly_income: number | null
          push_notifications_enabled: boolean | null
          state_province: string | null
          street_address: string | null
          theme_preference: string | null
          transactions_confirmation_enabled: boolean | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_2?: string | null
          address_type?: Database["public"]["Enums"]["address_type_enum"] | null
          avatar_url?: string | null
          budget_alerts_enabled?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          goals_progress_enabled?: boolean | null
          id: string
          monthly_income?: number | null
          push_notifications_enabled?: boolean | null
          state_province?: string | null
          street_address?: string | null
          theme_preference?: string | null
          transactions_confirmation_enabled?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_2?: string | null
          address_type?: Database["public"]["Enums"]["address_type_enum"] | null
          avatar_url?: string | null
          budget_alerts_enabled?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          goals_progress_enabled?: boolean | null
          id?: string
          monthly_income?: number | null
          push_notifications_enabled?: boolean | null
          state_province?: string | null
          street_address?: string | null
          theme_preference?: string | null
          transactions_confirmation_enabled?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_generated_date: string | null
          start_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_generated_date?: string | null
          start_date: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_generated_date?: string | null
          start_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_budget_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          percentage: number
          rule_name: string
          rule_type: string
          target_category_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          percentage: number
          rule_name: string
          rule_type: string
          target_category_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          percentage?: number
          rule_name?: string
          rule_type?: string
          target_category_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_budget_rules_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_budget_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          deleted_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_orders: {
        Row: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          id: number
          payment_intent_id: string
          payment_status: string
          status: Database["public"]["Enums"]["stripe_order_status"]
          updated_at: string | null
        }
        Insert: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at?: string | null
          currency: string
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_intent_id: string
          payment_status: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Update: {
          amount_subtotal?: number
          amount_total?: number
          checkout_session_id?: string
          created_at?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_intent_id?: string
          payment_status?: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string
          deleted_at: string | null
          id: number
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status?: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_error_logs: {
        Row: {
          context: Json | null
          error_message: string | null
          error_stack: string | null
          execution_id: string | null
          http_status: number | null
          id: number
          level: string
          node_name: string | null
          payload: Json | null
          phone_number: string | null
          ts: string | null
          workflow_id: string | null
          workflow_name: string | null
        }
        Insert: {
          context?: Json | null
          error_message?: string | null
          error_stack?: string | null
          execution_id?: string | null
          http_status?: number | null
          id?: number
          level?: string
          node_name?: string | null
          payload?: Json | null
          phone_number?: string | null
          ts?: string | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          context?: Json | null
          error_message?: string | null
          error_stack?: string | null
          execution_id?: string | null
          http_status?: number | null
          id?: number
          level?: string
          node_name?: string | null
          payload?: Json | null
          phone_number?: string | null
          ts?: string | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          id: string
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          transaction_date: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_suggestions: {
        Row: {
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          priority: string | null
          suggested_action: string | null
          suggestion_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          suggested_action?: string | null
          suggestion_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          suggested_action?: string | null
          suggestion_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stripe_user_orders: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          checkout_session_id: string | null
          currency: string | null
          customer_id: string | null
          order_date: string | null
          order_id: number | null
          order_status:
            | Database["public"]["Enums"]["stripe_order_status"]
            | null
          payment_intent_id: string | null
          payment_status: string | null
        }
        Relationships: []
      }
      stripe_user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["stripe_subscription_status"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_cadastro_por_email_phone: {
        Args: { p_email?: string; whatsaap?: string }
        Returns: {
          address_line_2: string | null
          address_type: Database["public"]["Enums"]["address_type_enum"] | null
          avatar_url: string | null
          budget_alerts_enabled: boolean | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          date_of_birth: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          goals_progress_enabled: boolean | null
          id: string
          monthly_income: number | null
          push_notifications_enabled: boolean | null
          state_province: string | null
          street_address: string | null
          theme_preference: string | null
          transactions_confirmation_enabled: boolean | null
          whatsapp: string | null
          zip_code: string | null
        }[]
      }
      calculate_debt_to_income_ratio: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_debt: {
        Args: {
          p_category?: string
          p_creditor?: string
          p_description: string
          p_due_date: string
          p_total_amount: number
        }
        Returns: Json
      }
      delete_debt: {
        Args: { p_debt_id: string }
        Returns: boolean
      }
      get_debt_by_id: {
        Args: { p_debt_id: string }
        Returns: Json
      }
      get_debt_status: {
        Args: {
          p_due_date: string
          p_paid_amount: number
          p_total_amount: number
        }
        Returns: string
      }
      get_debt_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_overdue_debts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_remaining_amount: {
        Args: { p_paid_amount: number; p_total_amount: number }
        Returns: number
      }
      get_upcoming_debts: {
        Args: { p_days_ahead?: number }
        Returns: Json
      }
      get_user_debts: {
        Args: {
          p_category?: string
          p_due_date_after?: string
          p_due_date_before?: string
          p_status?: string
        }
        Returns: Json
      }
      register_debt_payment: {
        Args: { p_debt_id: string; p_payment_amount: number }
        Returns: Json
      }
      settle_debt: {
        Args: { p_debt_id: string }
        Returns: Json
      }
      update_debt: {
        Args: {
          p_category?: string
          p_creditor?: string
          p_debt_id: string
          p_description?: string
          p_due_date?: string
          p_total_amount?: number
        }
        Returns: Json
      }
    }
    Enums: {
      address_type_enum: "Home" | "Work" | "Billing" | "Shipping"
      stripe_order_status: "pending" | "completed" | "canceled"
      stripe_subscription_status:
        | "not_started"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
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
      address_type_enum: ["Home", "Work", "Billing", "Shipping"],
      stripe_order_status: ["pending", "completed", "canceled"],
      stripe_subscription_status: [
        "not_started",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
