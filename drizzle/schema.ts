import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, text, timestamp, index, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const portfolios = mysqlTable("portfolios", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	content: text(),
	template: varchar({ length: 50 }).default('default').notNull(),
	published: int().default(0).notNull(),
	seoMeta: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const tenants = mysqlTable("tenants", {
	id: int().autoincrement().notNull(),
	subdomain: varchar({ length: 63 }).notNull(),
	displayName: varchar({ length: 255 }).notNull(),
	ownerId: int().notNull(),
	emoji: varchar({ length: 10 }),
	customDomain: varchar({ length: 255 }),
	settings: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("tenants_subdomain_unique").on(table.subdomain),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);
