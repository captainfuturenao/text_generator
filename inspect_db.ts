
import { db } from './lib/db';
import { templates } from './drizzle/schema';
import { desc } from 'drizzle-orm';

async function inspect() {
    console.log('Fetching all templates...');
    const all = db.select().from(templates).orderBy(desc(templates.createdAt)).all();

    console.log(`Found ${all.length} templates.`);

    all.forEach(t => {
        console.log(`[${t.id}] ${t.name} (Cat: ${t.category})`);
        try {
            const schema = JSON.parse(t.formSchema);
            const valid = schema.fields && Array.isArray(schema.fields) && schema.fields.every((f: any) => f.key);
            console.log(`   Schema Valid: ${valid}`);
            if (!valid) console.log(`   Schema Raw: ${t.formSchema}`);
        } catch (e) {
            console.log(`   Schema Invalid JSON: ${t.formSchema}`);
        }
    });
}

inspect();
