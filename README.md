# Portfolio Builder SaaS

A modern, multi-tenant portfolio builder built with Next.js 15, Supabase (PostgreSQL + Vector), and Redis. Create beautiful portfolio websites with custom subdomains in minutes.

## Features

- 🚀 **Multi-tenant Architecture** - Each user gets their own subdomain (e.g., `yourname.yourdomain.com`)
- 🔐 **OAuth Authentication** - Sign in with Google or Figma (no email/password)
- 📝 **Portfolio Editor** - Easy-to-use content editor with image uploads
- 🖼️ **Image Upload** - Supabase Storage integration for image hosting
- 🔍 **Full-Text Search** - PostgreSQL full-text search across all portfolios
- 🤖 **Vector Search Ready** - pgvector extension enabled for semantic search
- ⚡ **ISR (Incremental Static Regeneration)** - Fast page loads with automatic revalidation
- 🌐 **Edge Functions** - Optimized API routes using Vercel Edge Runtime
- 💾 **Redis Caching** - Fast data access with Redis caching layer
- 📊 **Database** - Supabase PostgreSQL with Row Level Security

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Authentication:** Supabase Auth (Google, Figma OAuth)
- **Database:** Supabase PostgreSQL with pgvector
- **Storage:** Supabase Storage
- **Caching:** Redis
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Redis server
- Supabase project

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/allthatin/portfolio-builder-saas.git
cd portfolio-builder-saas
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL migration from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
   - This will create all necessary tables, indexes, RLS policies, and functions

4. Configure Supabase:
   - Enable OAuth providers (Google, Figma) in Authentication → Providers
   - Create a storage bucket named `portfolio-images` (public)
   - Add your domain to Site URL and Redirect URLs in Authentication → Settings

5. Start the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup

#### 1. Database Schema

Run the migration file `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor. This will:
- Create `users`, `tenants`, and `portfolios` tables
- Set up foreign key constraints and indexes
- Enable pgvector extension for semantic search
- Create full-text search indexes
- Set up Row Level Security (RLS) policies
- Create a search function for efficient full-text search

#### 2. OAuth Providers

1. Go to Authentication → Providers in Supabase Dashboard
2. Enable Google:
   - Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Enable Figma:
   - Get OAuth credentials from [Figma Developer Portal](https://www.figma.com/developers)
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

#### 3. Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Create a new public bucket named `portfolio-images`
3. Set up storage policies to allow authenticated users to upload/delete their images

#### 4. Environment Variables

Get your Supabase credentials from Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep this secret!)

## Project Structure

```
portfolio-builder-saas/
├── app/
│   ├── api/              # API routes (Edge Functions)
│   │   ├── upload/       # Image upload endpoint
│   │   ├── portfolio/    # Portfolio CRUD
│   │   ├── search/       # Full-text search endpoint
│   │   └── revalidate/   # ISR revalidation
│   ├── auth/             # Authentication routes
│   ├── dashboard/        # User dashboard
│   │   └── edit/         # Portfolio editor
│   ├── s/[subdomain]/    # Subdomain pages (ISR enabled)
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── image-upload.tsx
│   ├── search-bar.tsx
│   └── subdomain-form.tsx
├── lib/
│   ├── db/               # Database client and types
│   │   ├── index.ts      # Supabase client
│   │   └── types.ts      # TypeScript types
│   ├── supabase/         # Supabase utilities
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   ├── middleware.ts # Auth middleware
│   │   └── storage.ts    # Storage utilities
│   ├── redis.ts          # Redis client
│   ├── subdomains.ts     # Subdomain utilities
│   └── utils.ts          # Helper functions
└── supabase/
    └── migrations/       # SQL migrations
        └── 001_initial_schema.sql
```

## Key Features Explained

### Multi-tenant Routing

The app uses Next.js middleware to detect subdomains and route to the appropriate portfolio page:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  if (subdomain && subdomain !== 'www') {
    return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
  }
}
```

### Full-Text Search

PostgreSQL full-text search with custom ranking function:

```typescript
// Uses the search_portfolios_and_tenants() function
const { data } = await db.rpc('search_portfolios_and_tenants', {
  search_query: query,
});
```

### Row Level Security (RLS)

Supabase RLS policies ensure data security:
- Users can only modify their own data
- Published portfolios are publicly viewable
- Unpublished portfolios are only visible to owners

### ISR (Incremental Static Regeneration)

Portfolio pages use ISR for optimal performance:

```typescript
// app/s/[subdomain]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

### Edge Functions

API routes use Vercel Edge Runtime for low latency:

```typescript
// app/api/search/route.ts
export const runtime = 'edge';
```

### Redis Caching

Tenant data is cached in Redis for fast access:

```typescript
// lib/subdomains.ts
const cached = await redis.get(`subdomain:${subdomain}`);
if (cached) return cached;
```

## Database Schema

### Users Table
- `id` (BIGSERIAL, primary key)
- `email` (VARCHAR 320, unique)
- `name` (VARCHAR 255, nullable)
- `avatar_url` (TEXT, nullable)
- `provider` (VARCHAR 50) - 'google' or 'figma'
- `provider_id` (VARCHAR 255, unique)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

### Tenants Table
- `id` (BIGSERIAL, primary key)
- `subdomain` (VARCHAR 63, unique)
- `display_name` (VARCHAR 255)
- `owner_id` (BIGINT, foreign key → users.id)
- `emoji` (VARCHAR 10, nullable)
- `custom_domain` (VARCHAR 255, nullable)
- `settings` (JSONB)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

### Portfolios Table
- `id` (BIGSERIAL, primary key)
- `tenant_id` (BIGINT, foreign key → tenants.id)
- `title` (VARCHAR 255)
- `description` (TEXT, nullable)
- `content` (TEXT, nullable)
- `template` (VARCHAR 50, default 'default')
- `published` (BOOLEAN, default false)
- `seo_meta` (JSONB)
- `content_embedding` (vector(1536), nullable) - For semantic search
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

## API Endpoints

- `POST /api/upload` - Upload image to Supabase Storage
- `PATCH /api/portfolio/[id]` - Update portfolio
- `DELETE /api/portfolio/[id]` - Delete portfolio
- `GET /api/search?q=query` - Full-text search portfolios
- `POST /api/revalidate?path=/s/subdomain` - Revalidate ISR page

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy

### Environment Variables on Vercel

Add the following environment variables in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`
- `NEXT_PUBLIC_ROOT_DOMAIN` (your production domain)

### Custom Domain Setup

1. Add your domain in Vercel project settings
2. Configure DNS:
   - Add an A record pointing to Vercel's IP
   - Add a wildcard CNAME record (`*.yourdomain.com`) pointing to your Vercel domain

## Migration from MySQL + Drizzle

This project has been refactored from MySQL + Drizzle ORM to Supabase PostgreSQL. Key changes:

1. **Database**: MySQL → PostgreSQL (Supabase)
2. **ORM**: Drizzle ORM → Supabase Client
3. **Search**: LIKE queries → PostgreSQL full-text search
4. **Vector Search**: Added pgvector extension for future semantic search
5. **Security**: Added Row Level Security (RLS) policies
6. **Types**: Maintained TypeScript type safety with custom types

## Future Enhancements

- [ ] Implement semantic search using pgvector and OpenAI embeddings
- [ ] Add real-time collaboration using Supabase Realtime
- [ ] Custom domain management
- [ ] Portfolio templates
- [ ] Analytics dashboard
- [ ] Export portfolio as static site

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT

## Support

For questions or issues, please open an issue on GitHub.

