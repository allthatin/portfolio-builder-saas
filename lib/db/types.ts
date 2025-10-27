// Database types for Supabase PostgreSQL
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './database.types';
import type { Database } from './database.types';

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];

export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type InsertTenant = Database['public']['Tables']['tenants']['Insert'];
export type UpdateTenant = Database['public']['Tables']['tenants']['Update'];

export type Portfolio = Database['public']['Tables']['portfolios']['Row'];
export type InsertPortfolio = Database['public']['Tables']['portfolios']['Insert'];
export type UpdatePortfolio = Database['public']['Tables']['portfolios']['Update'];

export type MarketItem = Database['public']['Tables']['market_items']['Row'];
export type InsertMarketItem = Database['public']['Tables']['market_items']['Insert'];
export type UpdateMarketItem = Database['public']['Tables']['market_items']['Update'];

export type PaymentRecord = Database['public']['Tables']['payment_records']['Row'];
export type InsertPaymentRecord = Database['public']['Tables']['payment_records']['Insert'];
export type UpdatePaymentRecord = Database['public']['Tables']['payment_records']['Update'];

export type Follow = Database['public']['Tables']['follows']['Row'];
export type InsertFollow = Database['public']['Tables']['follows']['Insert'];

export type Like = Database['public']['Tables']['likes']['Row'];
export type InsertLike = Database['public']['Tables']['likes']['Insert'];

export type UserBlock = Database['public']['Tables']['user_blocks']['Row'];
export type InsertUserBlock = Database['public']['Tables']['user_blocks']['Insert'];

// Enums
export type SocialProvider = Database['public']['Enums']['social_provider'];
export type BusinessType = Database['public']['Enums']['business_type'];
export type BusinessVerificationStatus = Database['public']['Enums']['business_verification_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type PaymentType = Database['public']['Enums']['payment_type'];
export type PricingType = Database['public']['Enums']['pricing_type'];
export type LikeAction = Database['public']['Enums']['like_action'];

// Tenant settings type - define the structure of settings JSONB
export interface TenantSettings {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  features?: {
    enableComments?: boolean;
    enableAnalytics?: boolean;
    enableNewsletter?: boolean;
  };
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  customCss?: string;
}

// Portfolio media files type
// Portfolio media files type
// Portfolio media files type
export interface MediaFile {
  id: string;
  url: string;
  path?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size?: number;
  thumbnail?: string;
}

// Type guard to validate MediaFile
export function isMediaFile(obj: MediaFile): obj is MediaFile {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.name === 'string' &&
    ['image', 'video', 'audio', 'document'].includes(obj.type)
  );
}

// Helper to safely parse media files from JSON
export function parseMediaFiles(json: unknown): MediaFile[] {
  if (!json) return [];
  if (!Array.isArray(json)) return [];
  return json.filter(isMediaFile);
}



// Market item AI metadata type
export interface MarketItemAIMetadata {
  tags?: string[];
  category?: string;
  extractedFeatures?: string[];
  qualityScore?: number;
}

// Profile persona metadata type
export interface PersonaMetadata {
  interests?: string[];
  skills?: string[];
  personality?: string[];
  goals?: string[];
}

// Search result types
export interface ProfileSearchResult {
  id: string;
  nickname: string;
  job: string;
  description: string;
  rank: number;
}

export interface MarketSearchResult {
  id: string;
  title: string;
  description: string;
  score: number;
}

export interface PortfolioSearchResult {
  id: string;
  content: string;
  score: number;
}
