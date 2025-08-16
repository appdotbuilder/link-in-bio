import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { deleteLink } from '../handlers/delete_link';
import { eq } from 'drizzle-orm';

describe('deleteLink', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete a link owned by the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test link
    const linkResult = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Test Link',
        url: 'https://example.com',
        order_index: 0
      })
      .returning()
      .execute();

    const linkId = linkResult[0].id;

    // Delete the link
    const result = await deleteLink(linkId);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify link is deleted from database
    const deletedLink = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    expect(deletedLink).toHaveLength(0);
  });

  it('should throw error when link does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const nonExistentLinkId = 99999;

    // Attempt to delete non-existent link
    expect(deleteLink(nonExistentLinkId)).rejects.toThrow(/link not found/i);
  });

  it('should successfully delete any link by ID', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test link
    const linkResult = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Any User Link',
        url: 'https://anyuser.example.com',
        order_index: 0
      })
      .returning()
      .execute();

    const linkId = linkResult[0].id;

    // Delete the link (no authorization check needed in current API)
    const result = await deleteLink(linkId);
    expect(result.success).toBe(true);

    // Verify link is deleted
    const deletedLink = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    expect(deletedLink).toHaveLength(0);
  });

  it('should handle multiple links deletion correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple test links
    const link1Result = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Link 1',
        url: 'https://example1.com',
        order_index: 0
      })
      .returning()
      .execute();

    const link2Result = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Link 2',
        url: 'https://example2.com',
        order_index: 1
      })
      .returning()
      .execute();

    const link1Id = link1Result[0].id;
    const link2Id = link2Result[0].id;

    // Delete first link
    const result1 = await deleteLink(link1Id);
    expect(result1.success).toBe(true);

    // Verify first link is deleted, second still exists
    const remainingLinks = await db.select()
      .from(linksTable)
      .where(eq(linksTable.user_id, userId))
      .execute();

    expect(remainingLinks).toHaveLength(1);
    expect(remainingLinks[0].id).toBe(link2Id);
    expect(remainingLinks[0].title).toBe('Link 2');

    // Delete second link
    const result2 = await deleteLink(link2Id);
    expect(result2.success).toBe(true);

    // Verify all links are deleted
    const finalLinks = await db.select()
      .from(linksTable)
      .where(eq(linksTable.user_id, userId))
      .execute();

    expect(finalLinks).toHaveLength(0);
  });

  it('should handle link with custom properties correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create link with all properties set
    const linkResult = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Custom Link',
        url: 'https://custom.example.com',
        icon: 'https://custom.example.com/icon.png',
        click_count: 42,
        is_active: false,
        order_index: 5
      })
      .returning()
      .execute();

    const linkId = linkResult[0].id;

    // Verify link exists with correct properties before deletion
    const existingLink = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    expect(existingLink).toHaveLength(1);
    expect(existingLink[0].click_count).toBe(42);
    expect(existingLink[0].is_active).toBe(false);
    expect(existingLink[0].icon).toBe('https://custom.example.com/icon.png');

    // Delete the link
    const result = await deleteLink(linkId);
    expect(result.success).toBe(true);

    // Verify link is deleted
    const deletedLink = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    expect(deletedLink).toHaveLength(0);
  });
});