import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { templates } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function removeDuplicates() {
    const { db } = await import('./lib/db');

    console.log('Fetching all templates...');
    const all = await db.select().from(templates).all();

    // Group by name
    const groups: Record<string, string[]> = {};
    all.forEach(t => {
        if (!groups[t.name]) groups[t.name] = [];
        groups[t.name].push(t.id);
    });

    for (const name in groups) {
        const ids = groups[name];
        if (ids.length > 1) {
            console.log(`Duplicate found for "${name}": ${ids.length} entries.`);
            // Keep the first one, delete the rest
            const toDelete = ids.slice(1);
            for (const id of toDelete) {
                console.log(`Deleting duplicate ID: ${id}`);
                try {
                    await db.delete(templates).where(eq(templates.id, id)).run();
                } catch (e) {
                    console.error(`Could not delete ${id}, likely has history dependencies.`);
                }
            }
        }
    }

    console.log('Cleanup of duplicates finished.');
}

removeDuplicates();
