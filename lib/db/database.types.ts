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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          action: Database["public"]["Enums"]["like_action"]
          created_at: string
          id: string
          is_permanent: boolean | null
          record_id: string
          table_name: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["like_action"]
          created_at?: string
          id?: string
          is_permanent?: boolean | null
          record_id: string
          table_name: string
          tenant_id: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["like_action"]
          created_at?: string
          id?: string
          is_permanent?: boolean | null
          record_id?: string
          table_name?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_items: {
        Row: {
          ai_embedding: string | null
          ai_metadata: Json | null
          created_at: string
          currency: string | null
          description: string
          id: string
          is_hidden: boolean | null
          pricing_type: Database["public"]["Enums"]["pricing_type"] | null
          search_vector: unknown
          seller_id: string | null
          slug: string
          tenant_id: string
          title: string
          updated_at: string
          uuid: string | null
        }
        Insert: {
          ai_embedding?: string | null
          ai_metadata?: Json | null
          created_at?: string
          currency?: string | null
          description: string
          id?: string
          is_hidden?: boolean | null
          pricing_type?: Database["public"]["Enums"]["pricing_type"] | null
          search_vector?: unknown
          seller_id?: string | null
          slug: string
          tenant_id: string
          title: string
          updated_at?: string
          uuid?: string | null
        }
        Update: {
          ai_embedding?: string | null
          ai_metadata?: Json | null
          created_at?: string
          currency?: string | null
          description?: string
          id?: string
          is_hidden?: boolean | null
          pricing_type?: Database["public"]["Enums"]["pricing_type"] | null
          search_vector?: unknown
          seller_id?: string | null
          slug?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          failure_reason: string | null
          gateway_name: string | null
          id: string
          payment_completed_at: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          refund_amount: number
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          uuid: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          creator_id: string
          failure_reason?: string | null
          gateway_name?: string | null
          id?: string
          payment_completed_at?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          refund_amount?: number
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          uuid?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          failure_reason?: string | null
          gateway_name?: string | null
          id?: string
          payment_completed_at?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          refund_amount?: number
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          content: string | null
          created_at: string
          editor_id: string | null
          essence_metadata: Json | null
          id: string
          is_hidden: boolean | null
          media_files: Json | null
          search_vector: unknown
          tenant_id: string
          updated_at: string
          uuid: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          editor_id?: string | null
          id?: string
          is_hidden?: boolean | null
          media_files?: Json | null
          search_vector?: unknown
          tenant_id: string
          updated_at?: string
          uuid?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          editor_id?: string | null
          id?: string
          is_hidden?: boolean | null
          media_files?: Json | null
          search_vector?: unknown
          tenant_id?: string
          updated_at?: string
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_cover_url: string | null
          business_logo_url: string | null
          business_name: string | null
          business_registration_doc_url: string | null
          business_registration_number: string | null
          business_representative_name: string | null
          business_start_date: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          business_verification_message: string | null
          business_verification_status:
            | Database["public"]["Enums"]["business_verification_status"]
            | null
          date_joined: string
          description: string | null
          deviceid: string | null
          email: string | null
          hash_phone: string | null
          id: string
          is_admin: boolean | null
          is_business: boolean | null
          is_emailverified: boolean | null
          is_premium: boolean | null
          is_staff: boolean | null
          job: string | null
          name: string | null
          nickname: string | null
          persona_embedding: string | null
          persona_metadata: Json | null
          premium_expiration: string | null
          provider: Database["public"]["Enums"]["social_provider"] | null
          role: string
          search_vector: unknown
          tenant_id: string | null
          updated_at: string
          uservid: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_cover_url?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_registration_doc_url?: string | null
          business_registration_number?: string | null
          business_representative_name?: string | null
          business_start_date?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          business_verification_message?: string | null
          business_verification_status?:
            | Database["public"]["Enums"]["business_verification_status"]
            | null
          date_joined?: string
          description?: string | null
          deviceid?: string | null
          email?: string | null
          hash_phone?: string | null
          id: string
          is_admin?: boolean | null
          is_business?: boolean | null
          is_emailverified?: boolean | null
          is_premium?: boolean | null
          is_staff?: boolean | null
          job?: string | null
          name?: string | null
          nickname?: string | null
          persona_embedding?: string | null
          persona_metadata?: Json | null
          premium_expiration?: string | null
          provider?: Database["public"]["Enums"]["social_provider"] | null
          role?: string
          search_vector?: unknown
          tenant_id?: string | null
          updated_at?: string
          uservid?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_cover_url?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_registration_doc_url?: string | null
          business_registration_number?: string | null
          business_representative_name?: string | null
          business_start_date?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          business_verification_message?: string | null
          business_verification_status?:
            | Database["public"]["Enums"]["business_verification_status"]
            | null
          date_joined?: string
          description?: string | null
          deviceid?: string | null
          email?: string | null
          hash_phone?: string | null
          id?: string
          is_admin?: boolean | null
          is_business?: boolean | null
          is_emailverified?: boolean | null
          is_premium?: boolean | null
          is_staff?: boolean | null
          job?: string | null
          name?: string | null
          nickname?: string | null
          persona_embedding?: string | null
          persona_metadata?: Json | null
          premium_expiration?: string | null
          provider?: Database["public"]["Enums"]["social_provider"] | null
          role?: string
          search_vector?: unknown
          tenant_id?: string | null
          updated_at?: string
          uservid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          display_name: string
          id: string
          plan: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          plan?: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          plan?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      toss_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          tenant_id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          tenant_id: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_payment: { Args: { payment_uuid: string }; Returns: undefined }
      hybrid_search_market: {
        Args: {
          query_embedding: string
          query_text: string
          result_limit?: number
          target_tenant_id: string
          weight_semantic?: number
          weight_text?: number
        }
        Returns: {
          description: string
          id: string
          score: number
          title: string
        }[]
      }
      hybrid_search_portfolios: {
        Args: {
          query_embedding: string
          query_text: string
          result_limit?: number
          target_tenant_id: string
          weight_semantic?: number
          weight_text?: number
        }
        Returns: {
          content: string
          id: string
          score: number
        }[]
      }
      process_payment_refund: {
        Args: { payment_uuid: string; refund_amt?: number }
        Returns: undefined
      }
      search_profiles: {
        Args: {
          query_text: string
          result_limit?: number
          target_tenant_id: string
        }
        Returns: {
          description: string
          id: string
          job: string
          nickname: string
          rank: number
        }[]
      }
      set_tenant_context: { Args: { tenant_uuid: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      business_type: "INDIVIDUAL_BUSINESS" | "CORPORATE"
      business_verification_status:
        | "none"
        | "pending"
        | "api_verified"
        | "fully_verified"
        | "failed"
      like_action: "like" | "dislike"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
      payment_type: "premium" | "credit" | "subscribe" | "merchandise"
      pricing_type: "fixed" | "subscription" | "quote" | "free"
      social_provider:
        | "kakao"
        | "naver"
        | "facebook"
        | "instagram"
        | "google"
        | "apple"
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
      business_type: ["INDIVIDUAL_BUSINESS", "CORPORATE"],
      business_verification_status: [
        "none",
        "pending",
        "api_verified",
        "fully_verified",
        "failed",
      ],
      like_action: ["like", "dislike"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      payment_type: ["premium", "credit", "subscribe", "merchandise"],
      pricing_type: ["fixed", "subscription", "quote", "free"],
      social_provider: [
        "kakao",
        "naver",
        "facebook",
        "instagram",
        "google",
        "apple",
      ],
    },
  },
} as const
