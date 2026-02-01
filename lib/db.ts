import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/drizzle/schema';

// Use environment variables for connection
// In local dev without keys, it defaults to a local file
const url = process.env.TURSO_CONNECTION_URL || 'file:sqlite.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

export const db = drizzle(client, { schema });
