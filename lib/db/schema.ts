import { int, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

/**
 * Users table for authentication
 */
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  provider: varchar('provider', { length: 50 }).notNull(), // 'google' or 'figma'
  providerId: varchar('provider_id', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tenants table for multi-tenant architecture
 */
export const tenants = mysqlTable('tenants', {
  id: int('id').autoincrement().primaryKey(),
  subdomain: varchar('subdomain', { length: 63 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  ownerId: int('owner_id').notNull(),
  emoji: varchar('emoji', { length: 10 }),
  customDomain: varchar('custom_domain', { length: 255 }),
  settings: text('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Portfolios table for storing portfolio content
 */
export const portfolios = mysqlTable('portfolios', {
  id: int('id').autoincrement().primaryKey(),
  tenantId: int('tenant_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content'),
  template: varchar('template', { length: 50 }).default('default').notNull(),
  published: int('published').default(0).notNull(),
  seoMeta: text('seo_meta'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

