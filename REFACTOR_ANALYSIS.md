# Refactoring Analysis: MySQL + Drizzle to Supabase Postgres

## Current Architecture

### Database Stack
- **ORM**: Drizzle ORM with MySQL dialect
- **Database**: MySQL/TiDB
- **Auth**: Supabase Auth (OAuth with Google/Figma)
- **Storage**: Supabase Storage (for images)
- **Cache**: Redis

### Database Schema (MySQL + Drizzle)

#### Users Table
- `id` (INT, auto-increment, primary key)
- `email` (VARCHAR 320, unique, not null)
- `name` (VARCHAR 255)
- `avatarUrl` (TEXT)
- `provider` (VARCHAR 50, not null) - 'google' or 'figma'
- `providerId` (VARCHAR 255, unique, not null)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

#### Tenants Table
- `id` (INT, auto-increment, primary key)
- `subdomain` (VARCHAR 63, unique, not null)
- `displayName` (VARCHAR 255, not null)
- `ownerId` (INT, not null) - references users.id
- `emoji` (VARCHAR 10)
- `customDomain` (VARCHAR 255)
- `settings` (TEXT)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

#### Portfolios Table
- `id` (INT, auto-increment, primary key)
- `tenantId` (INT, not null) - references tenants.id
- `title` (VARCHAR 255, not null)
- `description` (TEXT)
- `content` (TEXT)
- `template` (VARCHAR 50, default 'default')
- `published` (INT, default 0)
- `seoMeta` (TEXT)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### Current Usage Patterns

#### Drizzle ORM Usage
1. **lib/db/index.ts**: Database connection using `drizzle-orm/mysql2`
2. **lib/db/schema.ts**: Schema definitions using MySQL-specific types
3. **drizzle.config.ts**: Drizzle configuration with MySQL dialect

#### Database Operations
1. **app/actions.ts**:
   - `db.query.users.findFirst()` - Find user by providerId
   - `db.select().from(tenants).where()` - Check subdomain availability
   - `db.insert(tenants).values()` - Create tenant
   - `db.insert(portfolios).values()` - Create portfolio
   - `db.delete(portfolios).where()` - Delete portfolios
   - `db.delete(tenants).where()` - Delete tenant

2. **app/api/portfolio/[id]/route.ts**:
   - `db.query.portfolios.findFirst()` - Get portfolio by ID
   - `db.query.tenants.findFirst()` - Get tenant by ID
   - `db.query.users.findFirst()` - Get user by providerId

3. **app/api/search/route.ts**:
   - `db.select().from(tenants).where(or(like(...)))` - Search tenants
   - `db.select().from(portfolios).innerJoin().where()` - Search portfolios

4. **app/auth/callback/route.ts**:
   - `db.insert(users).values()` - Create new user

5. **lib/subdomains.ts**:
   - `db.query.tenants.findFirst()` - Get tenant by subdomain

#### Supabase Usage (Currently)
1. **Authentication**: `supabase.auth.getUser()` - Get authenticated user
2. **Storage**: `supabase.storage.from('portfolio-images')` - Image upload/delete

### Files to Modify

#### Database Layer
- `lib/db/index.ts` - Replace Drizzle with Supabase client
- `lib/db/schema.ts` - Convert to Supabase schema (SQL migrations)
- `drizzle.config.ts` - Remove (no longer needed)
- `drizzle/` directory - Remove migrations

#### Application Code
- `app/actions.ts` - Replace Drizzle queries with Supabase queries
- `app/api/portfolio/[id]/route.ts` - Replace Drizzle queries
- `app/api/search/route.ts` - Replace search logic (consider pgvector)
- `app/auth/callback/route.ts` - Replace user creation logic
- `lib/subdomains.ts` - Replace tenant lookup

#### Configuration
- `package.json` - Remove Drizzle and MySQL dependencies
- `.env.local` (example) - Remove DATABASE_URL

## Migration Strategy

### Phase 1: Schema Migration
1. Create Supabase tables using SQL migrations
2. Set up proper foreign key constraints
3. Add indexes for performance
4. Consider adding pgvector extension for search

### Phase 2: Code Refactoring
1. Replace `lib/db/index.ts` with Supabase client
2. Remove Drizzle schema definitions
3. Update all database queries to use Supabase client
4. Replace text search with PostgreSQL full-text search or pgvector

### Phase 3: Dependencies
1. Remove `drizzle-orm`, `drizzle-kit`, `mysql2`
2. Keep `@supabase/ssr` and `@supabase/supabase-js`
3. Update scripts in package.json

### Phase 4: Testing
1. Verify authentication flow
2. Test CRUD operations
3. Verify search functionality
4. Test subdomain creation/deletion

## Benefits of Migration

1. **Unified Stack**: Single platform for auth, database, and storage
2. **PostgreSQL Features**: Better JSON support, full-text search, pgvector
3. **Simplified Deployment**: No separate MySQL/TiDB instance needed
4. **Better Integration**: Native Supabase features (Row Level Security, Realtime)
5. **Cost Efficiency**: One service instead of multiple

## Potential Challenges

1. **Query Syntax**: Drizzle ORM → Supabase client syntax differences
2. **Type Safety**: Drizzle provides excellent TypeScript types
3. **Edge Runtime**: Supabase client compatibility with Vercel Edge
4. **Search**: Need to implement PostgreSQL full-text search or pgvector
5. **Auto-increment IDs**: PostgreSQL uses SERIAL/BIGSERIAL instead of AUTO_INCREMENT

## Next Steps

1. Create Supabase migration SQL
2. Set up type definitions for Supabase tables
3. Refactor database layer
4. Update all queries
5. Test thoroughly

