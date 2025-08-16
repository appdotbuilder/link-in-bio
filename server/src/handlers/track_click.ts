import { db } from '../db';
import { linksTable } from '../db/schema';
import { type TrackClickInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function trackClick(input: TrackClickInput): Promise<{ success: boolean; click_count: number }> {
  try {
    // Find the link by ID
    const links = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, input.link_id))
      .execute();

    if (links.length === 0) {
      throw new Error(`Link with ID ${input.link_id} not found`);
    }

    const link = links[0];

    // Check if link is active
    if (!link.is_active) {
      throw new Error(`Link with ID ${input.link_id} is not active`);
    }

    // Increment click count and update timestamp
    const newClickCount = link.click_count + 1;
    
    await db.update(linksTable)
      .set({
        click_count: newClickCount,
        updated_at: new Date()
      })
      .where(eq(linksTable.id, input.link_id))
      .execute();

    return {
      success: true,
      click_count: newClickCount
    };
  } catch (error) {
    console.error('Track click failed:', error);
    throw error;
  }
}