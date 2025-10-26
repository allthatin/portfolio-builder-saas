# Migration Guide: MySQL + Drizzle → Supabase PostgreSQL

This guide explains how to migrate from the old MySQL + Drizzle ORM setup to the new Supabase PostgreSQL architecture.

## Overview

The refactoring replaces:
- **MySQL/TiDB** → **Supabase PostgreSQL**
- **Drizzle ORM** → **Supabase Client**
- **Text LIKE queries** → **PostgreSQL full-text search**
- Added **pgvector** extension for future semantic search capabilities

## What Changed

### 1. Database Layer

#### Before (MySQL + Drizzle)
```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const conn = mysql.createPool({ uri: process.env.DATABASE_URL! });
export const db = drizzle(conn, { schema, mode: 'default' });
```

#### After (Supabase PostgreSQL)
```typescript
// lib/db/index.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

export const db = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 2. Schema Definition

#### Before (Drizzle Schema)
```typescript
// lib/db/schema.ts
import { mysqlTable, int, varchar, text, timestamp } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  // ...
});
```

#### After (TypeScript Types)
```typescript
// lib/db/types.ts
export interface User {
  id: number;
  email: string;
  // ...
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: InsertUser;
        Update: Partial<InsertUser>;
      };
    };
  };
}
```

Schema is now defined in SQL migrations (`supabase/migrations/001_initial_schema.sql`).

### 3. Query Syntax

#### Before (Drizzle ORM)
```typescript
// Find user
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.providerId, providerId),
});

// Insert tenant
const [tenant] = await db
  .insert(tenants)
  .values({ subdomain, displayName, ownerId })
  .$returningId();

// Delete with join
await db.delete(portfolios).where(eq(portfolios.tenantId, tenant.id));
```

#### After (Supabase Client)
```typescript
// Find user
const { data: user } = await db
  .from('users')
  .select('*')
  .eq('provider_id', providerId)
  .single();

// Insert tenant
const { data: tenant } = await db
  .from('tenants')
  .insert({ subdomain, display_name: displayName, owner_id: ownerId })
  .select()
  .single();

// Delete (cascade handled by foreign key)
await db.from('tenants').delete().eq('id', tenant.id);
```

### 4. Search Implementation

#### Before (LIKE queries)
```typescript
const results = await db
  .select()
  .from(portfolios)
  .where(
    or(
      like(portfolios.title, `%${query}%`),
      like(portfolios.description, `%${query}%`)
    )
  );
```

#### After (PostgreSQL full-text search)
```typescript
const { data: results } = await db
  .rpc('search_portfolios_and_tenants', {
    search_query: query,
  });
```

Uses a custom PostgreSQL function with `to_tsvector` and `ts_rank` for better search performance and relevance ranking.

### 5. Field Naming Convention

#### Before (camelCase)
- `providerId`
- `displayName`
- `tenantId`
- `createdAt`

#### After (snake_case)
- `provider_id`
- `display_name`
- `tenant_id`
- `created_at`

PostgreSQL convention uses snake_case for column names.

### 6. Data Types

#### Before (MySQL)
- `INT` with `AUTO_INCREMENT`
- `VARCHAR(n)`
- `TEXT`
- `TIMESTAMP`
- `INT` for boolean (0/1)

#### After (PostgreSQL)
- `BIGSERIAL` (auto-incrementing 64-bit integer)
- `VARCHAR(n)`
- `TEXT`
- `TIMESTAMP WITH TIME ZONE`
- `BOOLEAN` for boolean (true/false)
- `JSONB` for structured data
- `vector(1536)` for embeddings (pgvector)

## Migration Steps

### Step 1: Set Up Supabase Project

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and keys from Project Settings → API
3. Run the SQL migration in Supabase SQL Editor:
   ```sql
   -- Copy and paste content from supabase/migrations/001_initial_schema.sql
   ```

### Step 2: Update Environment Variables

Replace:
```env
DATABASE_URL=mysql://user:password@host:port/database
```

With:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Migrate Data (If Needed)

If you have existing data in MySQL, you need to migrate it:

1. Export data from MySQL:
```bash
mysqldump -u user -p database > backup.sql
```

2. Convert MySQL dump to PostgreSQL format (use tools like `pgloader` or manual conversion)

3. Import data to Supabase:
   - Use Supabase SQL Editor
   - Or use `psql` with connection string from Supabase

4. Adjust field names from camelCase to snake_case:
```sql
-- Example: Update field names if needed
UPDATE users SET provider_id = providerId WHERE provider_id IS NULL;
```

### Step 4: Install Dependencies

```bash
# Remove old dependencies
pnpm remove drizzle-orm drizzle-kit mysql2

# Install new dependencies (already in package.json)
pnpm install
```

### Step 5: Configure OAuth Providers

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google OAuth:
   - Add Client ID and Secret from Google Cloud Console
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Enable Figma OAuth:
   - Add Client ID and Secret from Figma Developer Portal
   - Same redirect URL

### Step 6: Set Up Storage

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `portfolio-images`
3. Make it public
4. Set up policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio-images');

-- Allow authenticated users to delete their images
CREATE POLICY "Users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio-images');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio-images');
```

### Step 7: Test the Application

1. Start the development server:
```bash
pnpm dev
```

2. Test key features:
   - [ ] User authentication (Google/Figma OAuth)
   - [ ] Create subdomain
   - [ ] Create/edit portfolio
   - [ ] Upload images
   - [ ] Search functionality
   - [ ] Delete subdomain

### Step 8: Deploy

1. Push changes to GitHub
2. Update environment variables in Vercel
3. Deploy

## Key Differences to Note

### 1. Error Handling

**Drizzle**: Throws errors for not found
```typescript
const user = await db.query.users.findFirst({ where: ... });
// user is undefined if not found
```

**Supabase**: Returns error object
```typescript
const { data: user, error } = await db.from('users').select().single();
if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
```

### 2. Transactions

**Drizzle**: Built-in transaction support
```typescript
await db.transaction(async (tx) => {
  await tx.insert(tenants).values(...);
  await tx.insert(portfolios).values(...);
});
```

**Supabase**: Use PostgreSQL transactions via RPC or handle at application level
```typescript
// Application-level: Create tenant first, then portfolio
// Rely on foreign key constraints for data integrity
```

### 3. Type Safety

**Drizzle**: Excellent type inference from schema
```typescript
const user: User = await db.query.users.findFirst(...);
```

**Supabase**: Manual type definitions required
```typescript
const { data } = await db.from('users').select();
// data is typed based on Database interface
```

### 4. Row Level Security (RLS)

**New Feature**: Supabase provides built-in RLS policies

```sql
-- Example: Users can only update their own tenants
CREATE POLICY "Owners can update their tenants"
ON public.tenants FOR UPDATE
USING (
  owner_id IN (
    SELECT id FROM public.users WHERE provider_id = auth.jwt()->>'sub'
  )
);
```

This adds an extra layer of security at the database level.

## Troubleshooting

### Issue: "relation does not exist"
**Solution**: Make sure you ran the SQL migration in Supabase SQL Editor.

### Issue: "permission denied for table"
**Solution**: Check RLS policies. For server-side operations, use the service role key.

### Issue: "invalid input syntax for type bigint"
**Solution**: Ensure you're passing numbers, not strings, for ID fields.

### Issue: Search not working
**Solution**: Verify the `search_portfolios_and_tenants` function was created. Check for typos in column names (use snake_case).

### Issue: Edge runtime errors
**Solution**: Supabase client is compatible with Edge runtime. Make sure you're not using Node.js-specific APIs.

## Performance Considerations

1. **Indexes**: The migration creates indexes on frequently queried columns
2. **Full-text search**: GIN indexes for fast text search
3. **Vector search**: IVFFlat index for pgvector (when used)
4. **Redis caching**: Keep using Redis for frequently accessed data
5. **Connection pooling**: Supabase handles this automatically

## Security Improvements

1. **RLS Policies**: Database-level security
2. **Service Role Key**: Only used server-side, never exposed to client
3. **Anon Key**: Safe to expose, limited by RLS policies
4. **JWT-based auth**: Automatic user context in RLS policies

## Next Steps

After migration:
1. Monitor performance in Supabase Dashboard
2. Set up database backups (automatic in Supabase)
3. Configure alerts for errors
4. Consider implementing semantic search with pgvector
5. Explore Supabase Realtime for live updates

## Rollback Plan

If you need to rollback:
1. Keep the old code in a separate branch
2. Restore MySQL database from backup
3. Revert environment variables
4. Redeploy old version

## Support

For issues specific to:
- **Supabase**: [Supabase Discord](https://discord.supabase.com/)
- **This project**: Open an issue on GitHub

