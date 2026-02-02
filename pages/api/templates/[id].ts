import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { templates } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    // Auth Check
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = req.headers['x-admin-password'];

    if (adminPassword && authHeader !== adminPassword) {
        return res.status(401).json({ message: 'Unauthorized: Invalid Admin Password' });
    }

    if (req.method === 'GET') {
        const template = db.select().from(templates).where(eq(templates.id, id)).get();
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        return res.status(200).json({ template });
    } else if (req.method === 'DELETE') {
        try {
            const result = await db.delete(templates).where(eq(templates.id, id)).run();
            if (result.rowsAffected === 0) {
                return res.status(404).json({ message: 'Template not found' });
            }
            return res.status(200).json({ message: 'Template deleted' });
        } catch (error: any) {
            console.error("Delete Error:", error);
            return res.status(500).json({ message: 'Failed to delete template', error: error.message });
        }
    } else if (req.method === 'PUT') {
        try {
            const { name, description, category, promptBase, formSchema, displayOrder } = req.body;

            // Basic validation
            if (!name || !description || !category || !promptBase || !formSchema) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const updatedTemplate = {
                name,
                description,
                category,
                promptBase,
                displayOrder: displayOrder || 0,
                formSchema: typeof formSchema === 'string' ? formSchema : JSON.stringify(formSchema),
                updatedAt: new Date(),
            };

            const result = await db.update(templates)
                .set(updatedTemplate)
                .where(eq(templates.id, id))
                .run();

            if (result.rowsAffected === 0) {
                return res.status(404).json({ message: 'Template not found' });
            }

            return res.status(200).json({ template: { id, ...updatedTemplate } });
        } catch (error: any) {
            console.error("Update Error:", error);
            return res.status(500).json({ message: 'Failed to update template', error: error.message });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
