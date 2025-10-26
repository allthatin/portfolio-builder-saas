import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  conn: mysql.Connection | undefined;
};

const conn = globalForDb.conn ?? mysql.createPool({
  uri: process.env.DATABASE_URL!,
});

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, { schema, mode: 'default' });

