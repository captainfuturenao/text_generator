import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { generations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Missing user ID' });
    }

    try {
        db.delete(generations).where(eq(generations.id, id)).run();
        return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
        console.error("Delete Error:", error);
        return res.status(500).json({ message: 'Failed to delete' });
    }
}
