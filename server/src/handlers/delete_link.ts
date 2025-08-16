import { db } from '../db';
import { linksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteLink = async (linkId: number): Promise<{ success: boolean }> => {
  try {
    // First, verify the link exists
    const existingLink = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    if (existingLink.length === 0) {
      throw new Error('Link not found');
    }

    // Delete the link
    const result = await db.delete(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Link deletion failed:', error);
    throw error;
  }
};