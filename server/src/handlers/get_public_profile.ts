import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { type GetPublicProfileInput, type PublicProfile } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

export async function getPublicProfile(input: GetPublicProfileInput): Promise<PublicProfile> {
  try {
    // Find user by username
    const users = await db.select({
      username: usersTable.username,
      display_name: usersTable.display_name,
      bio: usersTable.bio,
      avatar_url: usersTable.avatar_url
    })
    .from(usersTable)
    .where(eq(usersTable.username, input.username))
    .execute();

    if (users.length === 0) {
      throw new Error(`User with username "${input.username}" not found`);
    }

    const user = users[0];

    // Fetch all active links for this user ordered by order_index
    const userLinks = await db.select({
      id: linksTable.id,
      title: linksTable.title,
      url: linksTable.url,
      icon: linksTable.icon,
      click_count: linksTable.click_count
    })
    .from(linksTable)
    .innerJoin(usersTable, eq(linksTable.user_id, usersTable.id))
    .where(
      and(
        eq(usersTable.username, input.username),
        eq(linksTable.is_active, true)
      )
    )
    .orderBy(asc(linksTable.order_index))
    .execute();

    // Return public profile with links
    return {
      username: user.username,
      display_name: user.display_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      links: userLinks.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        click_count: link.click_count
      }))
    };
  } catch (error) {
    console.error('Get public profile failed:', error);
    throw error;
  }
}