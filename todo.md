# Portfolio Builder SaaS - TODO

## Phase 1: Project Setup & Authentication
- [x] Initialize Next.js 15 project
- [x] Install Supabase dependencies
- [x] Install Redis (ioredis) dependencies
- [x] Install Drizzle ORM and MySQL2
- [x] Create Supabase client utilities (browser & server)
- [x] Create Supabase middleware for session management
- [x] Create OAuth callback route handler
- [x] Create login page with Google and Figma OAuth buttons
- [x] Create authentication error page

## Phase 2: Database Schema
- [x] Create Drizzle configuration
- [x] Define users table schema
- [x] Define tenants table schema
- [x] Define portfolios table schema
- [ ] Run database migrations
- [ ] Seed initial data

## Phase 3: Multi-tenant Infrastructure
- [x] Create middleware for subdomain routing
- [x] Create Redis cache utilities
- [x] Create tenant subdomain page
- [ ] Implement custom domain support
- [ ] Add tenant context provider

## Phase 4: Core Portfolio Features
- [ ] Create dashboard page for authenticated users
- [ ] Implement tenant creation flow
- [ ] Implement portfolio creation/editing
- [ ] Create default portfolio template
- [ ] Add portfolio content editor
- [ ] Implement file upload for images
- [ ] Add SEO metadata management

## Phase 5: Advanced Features
- [ ] Implement ISR for portfolio pages
- [ ] Add caching layer for tenant data
- [ ] Set up Supabase Storage integration
- [ ] Set up Supabase VectorDB for search
- [ ] Add analytics tracking
- [ ] Implement portfolio themes/templates

## Phase 6: Deployment & Testing
- [ ] Configure environment variables
- [ ] Test OAuth flow (Google & Figma)
- [ ] Test multi-tenant routing
- [ ] Test Redis caching
- [ ] Deploy to Vercel
- [ ] Configure custom domain DNS
- [ ] Test production deployment

## Phase 7: Documentation
- [ ] Write README.md
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create user guide

