import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { generations, templates } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const history = db
            .select({
                id: generations.id,
                templateId: generations.templateId,
                templateName: templates.name,
                outputPreview: generations.outputText, // In real app, truncate this
                createdAt: generations.createdAt,
            })
            .from(generations)
            .leftJoin(templates, eq(generations.templateId, templates.id))
            .orderBy(desc(generations.createdAt))
            .all();

        // Truncate output for preview
        const formattedHistory = history.map(h => ({
            ...h,
            outputPreview: h.outputPreview.slice(0, 100) + (h.outputPreview.length > 100 ? '...' : '')
        }));

        return res.status(200).json(formattedHistory);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
