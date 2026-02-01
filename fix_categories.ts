
import { db } from './lib/db';
import { templates } from './drizzle/schema';
import { sql } from 'drizzle-orm';

async function fix() {
    console.log('Fixing categories (Business -> ビジネス)...');

    // SQLite case-insensitive partial match using LIKE or just direct update
    // We want to target 'Business', 'business', 'BUSINESS' etc.

    try {
        const result = db.run(sql`
            UPDATE templates 
            SET category = 'ビジネス' 
            WHERE lower(category) = 'business'
        `);
        console.log(`Updated ${result.changes} rows.`);
    } catch (e) {
        console.error('Update failed:', e);
    }

    console.log('Done.');
}

fix();
