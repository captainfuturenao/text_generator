import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
    schema: './drizzle/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.TURSO_CONNECTION_URL || 'file:sqlite.db',
        token: process.env.TURSO_AUTH_TOKEN,
    },
});
