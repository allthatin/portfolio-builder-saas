# Deployment Checklist

## Pre-Deployment

### 1. Supabase Setup
- [ ] Create Supabase project at https://supabase.com
- [ ] Copy project URL and keys from Project Settings → API
- [ ] Run SQL migration in Supabase SQL Editor:
  - Open `supabase/migrations/001_initial_schema.sql`
  - Copy entire content
  - Paste in SQL Editor and run
  - Verify tables created: `users`, `tenants`, `portfolios`

### 2. OAuth Configuration
- [ ] Enable Google OAuth in Supabase Dashboard
  - Go to Authentication → Providers → Google
  - Add Client ID and Secret from Google Cloud Console
  - Redirect URL: `https://[your-project].supabase.co/auth/v1/callback`
- [ ] Enable Figma OAuth (optional)
  - Go to Authentication → Providers → Figma
  - Add Client ID and Secret from Figma Developer Portal
  - Same redirect URL as above

### 3. Storage Setup
- [ ] Create storage bucket in Supabase Dashboard
  - Go to Storage → Create bucket
  - Name: `portfolio-images`
  - Make it public
  - Set up storage policies (see MIGRATION_GUIDE.md)

### 4. Environment Variables
Create `.env.local` file with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Redis
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
NODE_ENV=development
```

### 5. Dependencies
```bash
# Remove old dependencies (if not done)
pnpm remove drizzle-orm drizzle-kit mysql2

# Install dependencies
pnpm install
```

### 6. Local Testing
- [ ] Start Redis server: `redis-server`
- [ ] Start development server: `pnpm dev`
- [ ] Test authentication (Google/Figma login)
- [ ] Test subdomain creation
- [ ] Test portfolio CRUD operations
- [ ] Test image upload
- [ ] Test search functionality
- [ ] Test subdomain deletion

## Deployment to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "Refactor: Migrate from MySQL+Drizzle to Supabase PostgreSQL+Vector"
git push origin main
```

### 2. Vercel Project Setup
- [ ] Import repository in Vercel dashboard
- [ ] Configure build settings (auto-detected for Next.js)

### 3. Environment Variables in Vercel
Add the following in Vercel Project Settings → Environment Variables:

**Production**
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
REDIS_URL=[your-redis-url]
NEXT_PUBLIC_ROOT_DOMAIN=[your-domain.com]
NODE_ENV=production
```

**Preview & Development**
- Copy same values or use separate Supabase project for staging

### 4. Redis Setup
Choose one:
- [ ] **Upstash Redis** (recommended for Vercel)
  - Create account at https://upstash.com
  - Create Redis database
  - Copy connection URL
  - Update `REDIS_URL` in Vercel
- [ ] **Redis Cloud**
- [ ] **Self-hosted Redis**

### 5. Domain Configuration
- [ ] Add custom domain in Vercel project settings
- [ ] Configure DNS:
  ```
  A     @           76.76.21.21  (Vercel IP)
  CNAME *           cname.vercel-dns.com
  ```
- [ ] Update `NEXT_PUBLIC_ROOT_DOMAIN` to your domain

### 6. Supabase Redirect URLs
- [ ] Add production URLs in Supabase Dashboard
  - Go to Authentication → URL Configuration
  - Site URL: `https://[your-domain.com]`
  - Redirect URLs:
    - `https://[your-domain.com]/**`
    - `https://*.[your-domain.com]/**` (for subdomains)

### 7. Deploy
- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

## Post-Deployment

### 1. Verification
- [ ] Visit production URL
- [ ] Test authentication flow
- [ ] Create test subdomain
- [ ] Upload test image
- [ ] Test search
- [ ] Check subdomain routing (e.g., `test.[your-domain.com]`)

### 2. Monitoring
- [ ] Set up Vercel Analytics
- [ ] Enable Supabase logging
- [ ] Configure error tracking (Sentry, LogRocket, etc.)

### 3. Database Backup
- [ ] Supabase provides automatic daily backups
- [ ] Verify backup settings in Supabase Dashboard → Database → Backups
- [ ] Consider setting up additional backup strategy for critical data

### 4. Performance Optimization
- [ ] Enable Vercel Edge Caching
- [ ] Configure ISR revalidation times
- [ ] Monitor Redis cache hit rates
- [ ] Review Supabase query performance in Dashboard

## Rollback Plan

If issues occur:

### Option 1: Revert Deployment
```bash
# In Vercel dashboard
# Go to Deployments → Previous deployment → Promote to Production
```

### Option 2: Revert Code
```bash
git revert HEAD
git push origin main
```

### Option 3: Database Rollback
- Restore from Supabase backup
- Re-run old migrations if needed

## Troubleshooting

### Common Issues

**Authentication fails**
- Check OAuth credentials in Supabase
- Verify redirect URLs match
- Check browser console for errors

**Database connection errors**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase project status
- Review RLS policies

**Subdomain routing not working**
- Verify wildcard DNS record (`*.domain.com`)
- Check middleware.ts is deployed
- Test with different subdomain

**Image upload fails**
- Verify storage bucket exists and is public
- Check storage policies
- Verify `portfolio-images` bucket name

**Search not working**
- Verify `search_portfolios_and_tenants` function exists
- Check function permissions
- Review search query syntax

## Security Checklist

- [ ] Service role key is never exposed to client
- [ ] RLS policies are enabled on all tables
- [ ] Storage bucket has proper access policies
- [ ] Environment variables are properly scoped
- [ ] OAuth credentials are secure
- [ ] CORS settings are configured correctly

## Performance Checklist

- [ ] Database indexes are created (check migration)
- [ ] Redis caching is working
- [ ] ISR is configured for subdomain pages
- [ ] Edge runtime is used for API routes
- [ ] Images are optimized (Next.js Image component)

## Documentation

- [ ] Update README.md with production URLs
- [ ] Document any custom configurations
- [ ] Share MIGRATION_GUIDE.md with team
- [ ] Update API documentation if applicable

## Support

For issues:
1. Check REFACTORING_SUMMARY.md
2. Review MIGRATION_GUIDE.md
3. Check Supabase logs
4. Check Vercel deployment logs
5. Open GitHub issue with details

## Success Criteria

- ✅ All authentication flows work
- ✅ Subdomain creation and deletion work
- ✅ Portfolio CRUD operations work
- ✅ Image upload/delete works
- ✅ Search returns relevant results
- ✅ Subdomain routing works correctly
- ✅ No TypeScript build errors
- ✅ No runtime errors in production
- ✅ Performance is acceptable (< 1s page load)
- ✅ All environment variables are set

## Next Steps After Deployment

1. Monitor error rates and performance
2. Gather user feedback
3. Plan for semantic search implementation (pgvector)
4. Consider adding analytics
5. Implement additional features from roadmap

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________

**Notes**:

