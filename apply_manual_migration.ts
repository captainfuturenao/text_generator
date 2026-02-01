import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN; // Use authToken for client

if (!url || !authToken) {
    console.error('Missing TURSO credentials in .env.local');
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    try {
        const sqlPath = path.join(process.cwd(), 'drizzle', '0000_chemical_thing.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

        // Split by Drizzle's breakpoint
        const statements = sqlContent.split('--> statement-breakpoint');

        for (const stmt of statements) {
            if (stmt.trim()) {
                console.log('Executing:', stmt.substring(0, 50) + '...');
                await client.execute(stmt);
            }
        }
        console.log('Migration applied successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

main();
