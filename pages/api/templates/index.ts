import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { templates } from '@/drizzle/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Auth Check
        const adminPassword = process.env.ADMIN_PASSWORD;
        const authHeader = req.headers['x-admin-password'];

        if (adminPassword && authHeader !== adminPassword) {
            return res.status(401).json({ message: 'Unauthorized: Invalid Admin Password' });
        }

        const { name, description, category, promptBase, formSchema, displayOrder } = req.body;

        // Basic validation
        if (!name || !description || !category || !promptBase || !formSchema) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate formSchema is valid JSON and has fields
        try {
            const parsedSchema = typeof formSchema === 'string' ? JSON.parse(formSchema) : formSchema;
            if (!Array.isArray(parsedSchema.fields)) {
                throw new Error('Invalid schema structure');
            }
        } catch (e) {
            return res.status(400).json({ message: 'Invalid formSchema JSON' });
        }

        const id = crypto.randomUUID();
        const newTemplate = {
            id,
            name,
            description,
            category,
            promptBase,
            displayOrder: displayOrder || 0, // Default to 0 if not provided
            formSchema: typeof formSchema === 'string' ? formSchema : JSON.stringify(formSchema),
            isPublic: 1, // Defaulting to public for MVP
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        db.insert(templates).values(newTemplate).run();

        return res.status(201).json({ template: newTemplate });
    } catch (error: any) {
        console.error("Create Template Error:", error);
        return res.status(500).json({ message: 'Failed to create template', error: error.message });
    }
}
