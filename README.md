# Portfolio Builder SaaS

A modern, multi-tenant portfolio builder built with Next.js 15, Supabase, and Redis. Create beautiful portfolio websites with custom subdomains in minutes.

## Features

- 🚀 **Multi-tenant Architecture** - Each user gets their own subdomain (e.g., `yourname.yourdomain.com`)
- 🔐 **OAuth Authentication** - Sign in with Google or Figma (no email/password)
- 📝 **Portfolio Editor** - Easy-to-use content editor with image uploads
- 🖼️ **Image Upload** - Supabase Storage integration for image hosting
- 🔍 **Search** - Full-text search across all portfolios
- ⚡ **ISR (Incremental Static Regeneration)** - Fast page loads with automatic revalidation
- 🌐 **Edge Functions** - Optimized API routes using Vercel Edge Runtime
- 💾 **Redis Caching** - Fast data access with Redis caching layer
- 📊 **Database** - MySQL/TiDB with Drizzle ORM

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Authentication:** Supabase Auth (Google, Figma OAuth)
- **Database:** MySQL/TiDB with Drizzle ORM
- **Storage:** Supabase Storage
- **Caching:** Redis (not Upstash)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- MySQL/TiDB database
- Redis server
- Supabase project

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=mysql://user:password@host:port/database

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

3. Run database migrations:
```bash
pnpm db:push
```

4. Start the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Enable OAuth providers:
   - Go to Authentication → Providers
   - Enable Google and Figma
   - Add OAuth credentials from Google Cloud Console and Figma

3. Create a storage bucket:
   - Go to Storage
   - Create a new public bucket named `portfolio-images`

4. Set up redirect URLs:
   - Go to Authentication → Settings
   - Add your domain to Site URL and Redirect URLs

## Project Structure

```
portfolio-builder-saas/
├── app/
│   ├── api/              # API routes (Edge Functions)
│   │   ├── upload/       # Image upload endpoint
│   │   ├── portfolio/    # Portfolio CRUD
│   │   ├── search/       # Search endpoint
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
│   ├── db/               # Database schema and utilities
│   ├── supabase/         # Supabase client and utilities
│   ├── redis.ts          # Redis client
│   ├── subdomains.ts     # Subdomain utilities
│   └── utils.ts          # Helper functions
└── drizzle/              # Database migrations
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

### ISR (Incremental Static Regeneration)

Portfolio pages use ISR for optimal performance:

```typescript
// app/s/[subdomain]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

### Edge Functions

API routes use Vercel Edge Runtime for low latency:

```typescript
// app/api/upload/route.ts
export const runtime = 'edge';
```

### Redis Caching

Tenant data is cached in Redis for fast access:

```typescript
// lib/subdomains.ts
const cached = await redis.get(`subdomain:${subdomain}`);
if (cached) return cached;
```

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
- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_ROOT_DOMAIN` (your production domain)

### Custom Domain Setup

1. Add your domain in Vercel project settings
2. Configure DNS:
   - Add an A record pointing to Vercel's IP
   - Add a wildcard CNAME record (`*.yourdomain.com`) pointing to your Vercel domain

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(320) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tenants table
CREATE TABLE tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  owner_id INT NOT NULL,
  emoji VARCHAR(10),
  custom_domain VARCHAR(255),
  settings TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Portfolios table
CREATE TABLE portfolios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  template VARCHAR(50) DEFAULT 'default',
  published INT DEFAULT 0,
  seo_meta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

- `POST /api/upload` - Upload image to Supabase Storage
- `PATCH /api/portfolio/[id]` - Update portfolio
- `GET /api/search?q=query` - Search portfolios
- `POST /api/revalidate?path=/s/subdomain` - Revalidate ISR page

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT

## Support

For questions or issues, please open an issue on GitHub.

