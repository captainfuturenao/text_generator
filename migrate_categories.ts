
import { db } from './lib/db';
import { templates } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function migrate() {
    console.log('Migrating "business" to "ビジネス"...');

    // Select all templates with category 'business'
    const targets = db.select().from(templates).where(eq(templates.category, 'business')).all();

    console.log(`Found ${targets.length} templates to update.`);

    for (const t of targets) {
        try {
            await db.update(templates)
                .set({ category: 'ビジネス' })
                .where(eq(templates.id, t.id))
                .run();
            console.log(`Updated: ${t.name}`);
        } catch (e) {
            console.error(`Failed to update ${t.name}:`, e);
        }
    }
    console.log('Migration done.');
}

migrate();
