import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Testing connection to:', url);
console.log('Token length:', authToken ? authToken.length : 0);

const client = createClient({
    url,
    authToken,
});

async function main() {
    try {
        const rs = await client.execute('SELECT 1 as "connected"');
        console.log('Connection successful!', rs);
    } catch (e) {
        console.error('Connection failed:', e);
    }
}

main();
