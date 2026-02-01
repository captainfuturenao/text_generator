
import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Adding display_order column...');
    try {
        db.run(sql`ALTER TABLE templates ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0`);
        console.log('Column added.');
    } catch (e: any) {
        if (e.message.includes('duplicate column')) {
            console.log('Column already exists.');
        } else {
            console.error('Migration failed:', e);
        }
    }
}

migrate();
