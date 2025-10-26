-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table
-- Note: Supabase Auth already has auth.users table, but we need our own for app-specific data
CREATE TABLE public.users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) NOT NULL, -- 'google' or 'figma'
  provider_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on provider_id for faster lookups
CREATE INDEX idx_users_provider_id ON public.users(provider_id);

-- Tenants table for multi-tenant architecture
CREATE TABLE public.tenants (
  id BIGSERIAL PRIMARY KEY,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  owner_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji VARCHAR(10),
  custom_domain VARCHAR(255),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- Portfolios table for storing portfolio content
CREATE TABLE public.portfolios (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  template VARCHAR(50) DEFAULT 'default' NOT NULL,
  published BOOLEAN DEFAULT FALSE NOT NULL,
  seo_meta JSONB DEFAULT '{}'::jsonb,
  -- Vector embedding for semantic search (optional, for future use)
  content_embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups and search
CREATE INDEX idx_portfolios_tenant_id ON public.portfolios(tenant_id);
CREATE INDEX idx_portfolios_published ON public.portfolios(published);
CREATE INDEX idx_portfolios_content_embedding ON public.portfolios USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

-- Create full-text search indexes
CREATE INDEX idx_portfolios_title_search ON public.portfolios USING gin(to_tsvector('english', title));
CREATE INDEX idx_portfolios_description_search ON public.portfolios USING gin(to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_portfolios_content_search ON public.portfolios USING gin(to_tsvector('english', COALESCE(content, '')));
CREATE INDEX idx_tenants_display_name_search ON public.tenants USING gin(to_tsvector('english', display_name));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can read their own data
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (provider_id = auth.jwt()->>'sub');

-- Users can update their own data
CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (provider_id = auth.jwt()->>'sub');

-- RLS Policies for tenants table
-- Anyone can view tenants (for public portfolio pages)
CREATE POLICY "Anyone can view tenants"
  ON public.tenants
  FOR SELECT
  USING (true);

-- Only authenticated users can create tenants
CREATE POLICY "Authenticated users can create tenants"
  ON public.tenants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Owners can update their tenants
CREATE POLICY "Owners can update their tenants"
  ON public.tenants
  FOR UPDATE
  USING (
    owner_id IN (
      SELECT id FROM public.users WHERE provider_id = auth.jwt()->>'sub'
    )
  );

-- Owners can delete their tenants
CREATE POLICY "Owners can delete their tenants"
  ON public.tenants
  FOR DELETE
  USING (
    owner_id IN (
      SELECT id FROM public.users WHERE provider_id = auth.jwt()->>'sub'
    )
  );

-- RLS Policies for portfolios table
-- Anyone can view published portfolios
CREATE POLICY "Anyone can view published portfolios"
  ON public.portfolios
  FOR SELECT
  USING (published = true OR tenant_id IN (
    SELECT t.id FROM public.tenants t
    INNER JOIN public.users u ON t.owner_id = u.id
    WHERE u.provider_id = auth.jwt()->>'sub'
  ));

-- Tenant owners can create portfolios
CREATE POLICY "Tenant owners can create portfolios"
  ON public.portfolios
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.users u ON t.owner_id = u.id
      WHERE u.provider_id = auth.jwt()->>'sub'
    )
  );

-- Tenant owners can update their portfolios
CREATE POLICY "Tenant owners can update their portfolios"
  ON public.portfolios
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.users u ON t.owner_id = u.id
      WHERE u.provider_id = auth.jwt()->>'sub'
    )
  );

-- Tenant owners can delete their portfolios
CREATE POLICY "Tenant owners can delete their portfolios"
  ON public.portfolios
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.users u ON t.owner_id = u.id
      WHERE u.provider_id = auth.jwt()->>'sub'
    )
  );

-- Create a function for full-text search
CREATE OR REPLACE FUNCTION search_portfolios_and_tenants(search_query TEXT)
RETURNS TABLE(
  result_type TEXT,
  id BIGINT,
  subdomain VARCHAR(63),
  display_name VARCHAR(255),
  emoji VARCHAR(10),
  title VARCHAR(255),
  description TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  -- Search tenants
  SELECT
    'tenant'::TEXT as result_type,
    t.id,
    t.subdomain,
    t.display_name,
    t.emoji,
    NULL::VARCHAR(255) as title,
    NULL::TEXT as description,
    ts_rank(to_tsvector('english', t.display_name || ' ' || t.subdomain), plainto_tsquery('english', search_query)) as rank
  FROM public.tenants t
  WHERE
    to_tsvector('english', t.display_name || ' ' || t.subdomain) @@ plainto_tsquery('english', search_query)
    OR t.subdomain ILIKE '%' || search_query || '%'
    OR t.display_name ILIKE '%' || search_query || '%'
  
  UNION ALL
  
  -- Search portfolios
  SELECT
    'portfolio'::TEXT as result_type,
    p.id,
    t.subdomain,
    t.display_name,
    t.emoji,
    p.title,
    p.description,
    ts_rank(
      to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.content, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.portfolios p
  INNER JOIN public.tenants t ON p.tenant_id = t.id
  WHERE
    p.published = true
    AND (
      to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.content, '')) @@ plainto_tsquery('english', search_query)
      OR p.title ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR p.content ILIKE '%' || search_query || '%'
    )
  
  ORDER BY rank DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;

