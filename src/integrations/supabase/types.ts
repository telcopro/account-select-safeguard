export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          priority: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          priority: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      app_statistics: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          value?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      arbitrage_opportunities: {
        Row: {
          currency_path: string[]
          detected_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_volume: number
          profit_amount: number
          profit_percent: number
          source_names: string[]
        }
        Insert: {
          currency_path: string[]
          detected_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_volume: number
          profit_amount: number
          profit_percent: number
          source_names: string[]
        }
        Update: {
          currency_path?: string[]
          detected_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_volume?: number
          profit_amount?: number
          profit_percent?: number
          source_names?: string[]
        }
        Relationships: []
      }
      companies: {
        Row: {
          american_score: number
          created_at: string | null
          evaluation: string
          founded_in: string
          headquarters: string
          id: string
          logo_url: string | null
          name: string
          parent_company_id: string | null
        }
        Insert: {
          american_score: number
          created_at?: string | null
          evaluation: string
          founded_in: string
          headquarters: string
          id?: string
          logo_url?: string | null
          name: string
          parent_company_id?: string | null
        }
        Update: {
          american_score?: number
          created_at?: string | null
          evaluation?: string
          founded_in?: string
          headquarters?: string
          id?: string
          logo_url?: string | null
          name?: string
          parent_company_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_alternatives: {
        Row: {
          alternative_description: string
          alternative_name: string
          company_id: string
          created_at: string | null
          id: string
          is_eu_based: boolean | null
        }
        Insert: {
          alternative_description: string
          alternative_name: string
          company_id: string
          created_at?: string | null
          id?: string
          is_eu_based?: boolean | null
        }
        Update: {
          alternative_description?: string
          alternative_name?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_eu_based?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_alternatives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_crypto: boolean
          name: string
          symbol: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_crypto?: boolean
          name: string
          symbol?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_crypto?: boolean
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      currency_graph: {
        Row: {
          created_at: string
          from_currency: string
          id: string
          log_rate: number
          path_length: number
          rate: number
          source_rates: string[]
          to_currency: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_currency: string
          id?: string
          log_rate: number
          path_length?: number
          rate: number
          source_rates: string[]
          to_currency: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_currency?: string
          id?: string
          log_rate?: number
          path_length?: number
          rate?: number
          source_rates?: string[]
          to_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          api_url: string | null
          created_at: string
          id: string
          is_active: boolean
          is_manual: boolean
          last_sync: string | null
          name: string
        }
        Insert: {
          api_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_manual?: boolean
          last_sync?: string | null
          name: string
        }
        Update: {
          api_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_manual?: boolean
          last_sync?: string | null
          name?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          change_amount: number | null
          change_percent: number | null
          created_at: string
          from_currency_code: string
          id: string
          previous_rate: number | null
          rate: number
          source_id: string | null
          to_currency_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          change_amount?: number | null
          change_percent?: number | null
          created_at?: string
          from_currency_code: string
          id?: string
          previous_rate?: number | null
          rate: number
          source_id?: string | null
          to_currency_code: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          change_amount?: number | null
          change_percent?: number | null
          created_at?: string
          from_currency_code?: string
          id?: string
          previous_rate?: number | null
          rate?: number
          source_id?: string | null
          to_currency_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_statistics: {
        Row: {
          first_query_at: string | null
          id: string
          ip_address: string
          last_query_at: string | null
          query_count: number
        }
        Insert: {
          first_query_at?: string | null
          id?: string
          ip_address: string
          last_query_at?: string | null
          query_count?: number
        }
        Update: {
          first_query_at?: string | null
          id?: string
          ip_address?: string
          last_query_at?: string | null
          query_count?: number
        }
        Relationships: []
      }
      product_alternatives: {
        Row: {
          alternative_company: string
          alternative_description: string
          alternative_name: string
          created_at: string | null
          id: string
          is_eu_based: boolean | null
          product_id: string
        }
        Insert: {
          alternative_company: string
          alternative_description: string
          alternative_name: string
          created_at?: string | null
          id?: string
          is_eu_based?: boolean | null
          product_id: string
        }
        Update: {
          alternative_company?: string
          alternative_description?: string
          alternative_name?: string
          created_at?: string | null
          id?: string
          is_eu_based?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_alternatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_mappings: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          query_text: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          query_text: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          query_text?: string
        }
        Relationships: []
      }
      rate_history: {
        Row: {
          from_currency_code: string
          id: string
          rate: number
          recorded_at: string
          source_id: string | null
          to_currency_code: string
        }
        Insert: {
          from_currency_code: string
          id?: string
          rate: number
          recorded_at?: string
          source_id?: string | null
          to_currency_code: string
        }
        Update: {
          from_currency_code?: string
          id?: string
          rate?: number
          recorded_at?: string
          source_id?: string | null
          to_currency_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_history_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_searches: {
        Row: {
          created_at: string
          id: string
          query: string
          search_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          search_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          search_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      supported_countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          display_order: number | null
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      supported_institutions: {
        Row: {
          bic: string | null
          country_code: string
          created_at: string
          display_order: number | null
          id: string
          institution_id: string
          institution_name: string
          is_enabled: boolean
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          bic?: string | null
          country_code: string
          created_at?: string
          display_order?: number | null
          id?: string
          institution_id: string
          institution_name: string
          is_enabled?: boolean
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          bic?: string | null
          country_code?: string
          created_at?: string
          display_order?: number | null
          id?: string
          institution_id?: string
          institution_name?: string
          is_enabled?: boolean
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_search_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      track_ip_search: {
        Args: { ip: string }
        Returns: number
      }
      track_recent_search: {
        Args: { search_query: string }
        Returns: undefined
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
    Enums: {},
  },
} as const
