import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { type CreateLinkInput, type Link } from '../schema';
import { eq, max } from 'drizzle-orm';

export const createLink = async (input: CreateLinkInput): Promise<Link> => {
  try {
    // 1. Validate that the user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // 2. Set order_index to the next available position if not provided
    let orderIndex = input.order_index;
    if (orderIndex === undefined) {
      // Get the maximum order_index for this user's links
      const maxOrderResult = await db.select({ maxOrder: max(linksTable.order_index) })
        .from(linksTable)
        .where(eq(linksTable.user_id, input.user_id))
        .execute();

      const maxOrder = maxOrderResult[0]?.maxOrder;
      orderIndex = maxOrder !== null ? maxOrder + 1 : 0;
    }

    // 3. Create a new link record in the database
    const result = await db.insert(linksTable)
      .values({
        user_id: input.user_id,
        title: input.title,
        url: input.url,
        icon: input.icon || null,
        order_index: orderIndex,
        // click_count, is_active, created_at, updated_at will use database defaults
      })
      .returning()
      .execute();

    // 4. Return the created link data
    return result[0];
  } catch (error) {
    console.error('Link creation failed:', error);
    throw error;
  }
};