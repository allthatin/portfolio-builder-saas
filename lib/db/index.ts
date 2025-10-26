import { supabaseAdmin } from './client';
import type { User, Tenant, Portfolio } from './types';

// Export the admin client as db for compatibility
export const db = supabaseAdmin;

// Helper functions for common database operations

export async function getUserByProviderId(providerId: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('provider_id', providerId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
  
  return data;
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching tenant:', error);
    throw error;
  }
  
  return data;
}

export async function getPortfolioById(id: number): Promise<Portfolio | null> {
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

export async function getTenantById(id: number): Promise<Tenant | null> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching tenant:', error);
    throw error;
  }
  
  return data;
}

export async function getPortfoliosByTenantId(tenantId: number): Promise<Portfolio[]> {
  const { data, error } = await supabaseAdmin
    .from('portfolios')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching portfolios:', error);
    throw error;
  }
  
  return data || [];
}

export async function getTenantsByOwnerId(ownerId: number): Promise<Tenant[]> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }
  
  return data || [];
}

