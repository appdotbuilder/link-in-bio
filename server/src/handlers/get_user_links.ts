import { db } from '../db';
import { linksTable } from '../db/schema';
import { type Link } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getUserLinks = async (userId: number): Promise<Link[]> => {
  try {
    // Fetch all links belonging to the specified user, ordered by order_index
    const results = await db.select()
      .from(linksTable)
      .where(eq(linksTable.user_id, userId))
      .orderBy(asc(linksTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch user links:', error);
    throw error;
  }
};