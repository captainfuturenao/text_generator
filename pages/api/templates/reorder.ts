
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { templates } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { items } = req.body; // Expecting array of { id: string } in the desired order

    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid data format' });
    }

    try {
        // Update displayOrder based on the index in the array
        // We assign higher numbers to items earlier in the list if the current logic is "descending displayOrder"
        // Wait, current logic: orderBy(desc(templates.displayOrder))
        // So the first item in the list should have the HIGHEST displayOrder.

        const total = items.length;

        await db.transaction(async (tx) => {
            for (let i = 0; i < total; i++) {
                const item = items[i];
                // First item (i=0) gets highest order (total - 0)
                // Last item (i=total-1) gets lowest order (1)
                const newOrder = total - i;

                await tx.update(templates)
                    .set({ displayOrder: newOrder })
                    .where(eq(templates.id, item.id))
                    .run();
            }
        });

        return res.status(200).json({ message: 'Order updated' });
    } catch (error: any) {
        console.error("Reorder Error:", error);
        return res.status(500).json({ message: 'Failed to reorder', error: error.message });
    }
}
