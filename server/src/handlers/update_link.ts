import { db } from '../db';
import { linksTable } from '../db/schema';
import { type UpdateLinkInput, type Link } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateLink(input: UpdateLinkInput): Promise<Link> {
  try {
    // First, check if the link exists
    const existingLink = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, input.id))
      .execute();

    if (existingLink.length === 0) {
      throw new Error(`Link with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof linksTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.url !== undefined) {
      updateData.url = input.url;
    }
    if (input.icon !== undefined) {
      updateData.icon = input.icon;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }
    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    // Update the link
    const result = await db.update(linksTable)
      .set(updateData)
      .where(eq(linksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Link update failed:', error);
    throw error;
  }
}