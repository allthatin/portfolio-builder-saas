// lib/db/index.ts
import { getSupabaseAdmin } from './client';
import type { 
  Profile, 
  Tenant, 
  Portfolio, 
  MarketItem,
  PaymentRecord,
  ProfileSearchResult,
  MarketSearchResult,
  PortfolioSearchResult
} from './types';

const supabaseAdmin = getSupabaseAdmin();
export const db = supabaseAdmin;

// ============================================
// PROFILE OPERATIONS
// ============================================

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
  
  return data;
}

export async function getUserByProviderId(providerId: string): Promise<Profile | null> {
  return getProfileById(providerId);
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile by email:', error);
    throw error;
  }
  
  return data;
}

export async function getProfilesByTenantId(tenantId: string): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date_joined', { ascending: false });
  
  if (error) {
    console.error('Error fetching profiles by tenant:', error);
    throw error;
  }
  
  return data || [];
}

export async function getProfileWithTenant(userId: string): Promise<(Profile & { tenant: Tenant | null }) | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      tenant:tenants(*)
    `)
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile with tenant:', error);
    throw error;
  }
  
  return data ;
}

// ============================================
// TENANT OPERATIONS
// ============================================

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching tenant by slug:', error);
    throw error;
  }
  
  return data;
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  return getTenantBySlug(subdomain);
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching tenant by id:', error);
    throw error;
  }
  
  return data;
}

export async function getAllTenants(): Promise<Tenant[]> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all tenants:', error);
    throw error;
  }
  
  return data || [];
}

// ============================================
// PORTFOLIO OPERATIONS
// ============================================

export async function getPortfolioById(id: string): Promise<Portfolio | null> {
  const { data, error } = await supabaseAdmin
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
  
  return data;
}

export async function getPortfoliosByTenantId(tenantId: string): Promise<Portfolio[]> {
  const { data, error } = await supabaseAdmin
    .from('portfolios')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching portfolios by tenant:', error);
    throw error;
  }
  
  return data || [];
}

export async function getPortfoliosByEditorId(editorId: string): Promise<Portfolio[]> {
  const { data, error } = await supabaseAdmin
    .from('portfolios')
    .select('*')
    .eq('editor_id', editorId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching portfolios by editor:', error);
    throw error;
  }
  
  return data || [];
}

// ============================================
// MARKET ITEM OPERATIONS
// ============================================

export async function getMarketItemById(id: string): Promise<MarketItem | null> {
  const { data, error } = await supabaseAdmin
    .from('market_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching market item:', error);
    throw error;
  }
  
  return data;
}

export async function getMarketItemBySlug(slug: string, tenantId: string): Promise<MarketItem | null> {
  const { data, error } = await supabaseAdmin
    .from('market_items')
    .select('*')
    .eq('slug', slug)
    .eq('tenant_id', tenantId)
    .eq('is_hidden', false)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching market item by slug:', error);
    throw error;
  }
  
  return data;
}

export async function getMarketItemsByTenantId(tenantId: string): Promise<MarketItem[]> {
  const { data, error } = await supabaseAdmin
    .from('market_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching market items by tenant:', error);
    throw error;
  }
  
  return data || [];
}

export async function getMarketItemsBySellerId(sellerId: string): Promise<MarketItem[]> {
  const { data, error } = await supabaseAdmin
    .from('market_items')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching market items by seller:', error);
    throw error;
  }
  
  return data || [];
}

// ============================================
// PAYMENT OPERATIONS
// ============================================

export async function getPaymentRecordById(id: string): Promise<PaymentRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('payment_records')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching payment record:', error);
    throw error;
  }
  
  return data;
}

export async function getPaymentRecordByUuid(uuid: string): Promise<PaymentRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('payment_records')
    .select('*')
    .eq('uuid', uuid)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching payment record by uuid:', error);
    throw error;
  }
  
  return data;
}

export async function getPaymentRecordsByUserId(userId: string): Promise<PaymentRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('payment_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching payment records by user:', error);
    throw error;
  }
  
  return data || [];
}

export async function getPaymentRecordsByCreatorId(creatorId: string): Promise<PaymentRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('payment_records')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching payment records by creator:', error);
    throw error;
  }
  
  return data || [];
}

// ============================================
// SEARCH OPERATIONS
// ============================================

export async function searchProfiles(
  queryText: string,
  tenantId: string,
  limit: number = 10
): Promise<ProfileSearchResult[]> {
  const { data, error } = await supabaseAdmin
    .rpc('search_profiles', {
      query_text: queryText,
      target_tenant_id: tenantId,
      result_limit: limit
    });
  
  if (error) {
    console.error('Error searching profiles:', error);
    throw error;
  }
  
  return data || [];
}

export async function hybridSearchMarket(
  queryEmbedding: string,
  queryText: string,
  tenantId: string,
  limit: number = 10,
  weightSemantic: number = 0.5,
  weightText: number = 0.5
): Promise<MarketSearchResult[]> {
  const { data, error } = await supabaseAdmin
    .rpc('hybrid_search_market', {
      query_embedding: queryEmbedding,
      query_text: queryText,
      target_tenant_id: tenantId,
      result_limit: limit,
      weight_semantic: weightSemantic,
      weight_text: weightText
    });
  
  if (error) {
    console.error('Error hybrid searching market:', error);
    throw error;
  }
  
  return data || [];
}

export async function hybridSearchPortfolios(
  queryEmbedding: string,
  queryText: string,
  tenantId: string,
  limit: number = 10,
  weightSemantic: number = 0.5,
  weightText: number = 0.5
): Promise<PortfolioSearchResult[]> {
  const { data, error } = await supabaseAdmin
    .rpc('hybrid_search_portfolios', {
      query_embedding: queryEmbedding,
      query_text: queryText,
      target_tenant_id: tenantId,
      result_limit: limit,
      weight_semantic: weightSemantic,
      weight_text: weightText
    });
  
  if (error) {
    console.error('Error hybrid searching portfolios:', error);
    throw error;
  }
  
  return data || [];
}

// ============================================
// FOLLOW OPERATIONS
// ============================================

export async function isFollowing(followerId: string, followingId: string, tenantId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
  
  return !!data;
}

export async function getFollowerCount(userId: string, tenantId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
    .eq('tenant_id', tenantId);
  
  if (error) {
    console.error('Error getting follower count:', error);
    throw error;
  }
  
  return count || 0;
}

export async function getFollowingCount(userId: string, tenantId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
    .eq('tenant_id', tenantId);
  
  if (error) {
    console.error('Error getting following count:', error);
    throw error;
  }
  
  return count || 0;
}

// ============================================
// LIKE OPERATIONS
// ============================================

export async function getLikeCount(recordId: string, tableName: string, tenantId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('record_id', recordId)
    .eq('table_name', tableName)
    .eq('tenant_id', tenantId)
    .eq('action', 'like');
  
  if (error) {
    console.error('Error getting like count:', error);
    throw error;
  }
  
  return count || 0;
}

export async function hasUserLiked(
  userId: string, 
  recordId: string, 
  tableName: string, 
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('likes')
    .select('action')
    .eq('user_id', userId)
    .eq('record_id', recordId)
    .eq('table_name', tableName)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking like status:', error);
    throw error;
  }
  
  return data?.action === 'like';
}
