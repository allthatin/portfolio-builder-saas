// Database types for Supabase PostgreSQL
// These types match the schema defined in supabase/migrations/001_initial_schema.sql

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  provider: string;
  provider_id: string;
  created_at: string;
  updated_at: string;
}

export interface InsertUser {
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  provider: string;
  provider_id: string;
}

export interface Tenant {
  id: number;
  subdomain: string;
  display_name: string;
  owner_id: number;
  emoji: string | null;
  custom_domain: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InsertTenant {
  subdomain: string;
  display_name: string;
  owner_id: number;
  emoji?: string | null;
  custom_domain?: string | null;
  settings?: Record<string, any>;
}

export interface Portfolio {
  id: number;
  tenant_id: number;
  title: string;
  description: string | null;
  content: string | null;
  template: string;
  published: boolean;
  seo_meta: Record<string, any>;
  content_embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface InsertPortfolio {
  tenant_id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  template?: string;
  published?: boolean;
  seo_meta?: Record<string, any>;
  content_embedding?: number[] | null;
}

export interface SearchResult {
  result_type: 'tenant' | 'portfolio';
  id: number;
  subdomain: string;
  display_name: string;
  emoji: string | null;
  title: string | null;
  description: string | null;
  rank: number;
}

// Database schema type for Supabase client
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: InsertUser;
        Update: Partial<InsertUser>;
        Relationships: [];
      };
      tenants: {
        Row: Tenant;
        Insert: InsertTenant;
        Update: Partial<InsertTenant>;
        Relationships: [
          {
            foreignKeyName: "tenants_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      portfolios: {
        Row: Portfolio;
        Insert: InsertPortfolio;
        Update: Partial<InsertPortfolio>;
        Relationships: [
          {
            foreignKeyName: "portfolios_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_portfolios_and_tenants: {
        Args: { search_query: string };
        Returns: SearchResult[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

