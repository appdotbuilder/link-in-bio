import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { type TrackClickInput } from '../schema';
import { trackClick } from '../handlers/track_click';
import { eq } from 'drizzle-orm';

describe('trackClick', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test user and link
  const createTestUserAndLink = async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
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
        click_count: 5,
        is_active: true,
        order_index: 0
      })
      .returning()
      .execute();

    return { userId, linkId: linkResult[0].id, initialClickCount: 5 };
  };

  it('should increment click count for active link', async () => {
    const { linkId, initialClickCount } = await createTestUserAndLink();

    const input: TrackClickInput = {
      link_id: linkId
    };

    const result = await trackClick(input);

    // Verify response
    expect(result.success).toBe(true);
    expect(result.click_count).toBe(initialClickCount + 1);

    // Verify database was updated
    const links = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    expect(links).toHaveLength(1);
    expect(links[0].click_count).toBe(initialClickCount + 1);
    expect(links[0].updated_at).toBeInstanceOf(Date);
  });

  it('should increment from zero click count', async () => {
    const { userId } = await createTestUserAndLink();

    // Create link with zero clicks
    const zeroClickLinkResult = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Zero Click Link',
        url: 'https://zero.com',
        click_count: 0,
        is_active: true,
        order_index: 1
      })
      .returning()
      .execute();

    const input: TrackClickInput = {
      link_id: zeroClickLinkResult[0].id
    };

    const result = await trackClick(input);

    expect(result.success).toBe(true);
    expect(result.click_count).toBe(1);

    // Verify database update
    const links = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, zeroClickLinkResult[0].id))
      .execute();

    expect(links[0].click_count).toBe(1);
  });

  it('should handle multiple clicks correctly', async () => {
    const { linkId } = await createTestUserAndLink();

    const input: TrackClickInput = {
      link_id: linkId
    };

    // First click
    const result1 = await trackClick(input);
    expect(result1.click_count).toBe(6);

    // Second click
    const result2 = await trackClick(input);
    expect(result2.click_count).toBe(7);

    // Third click
    const result3 = await trackClick(input);
    expect(result3.click_count).toBe(8);

    // Verify final database state
    const links = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    expect(links[0].click_count).toBe(8);
  });

  it('should update timestamp when tracking click', async () => {
    const { linkId } = await createTestUserAndLink();

    // Get original timestamp
    const originalLinks = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();
    
    const originalTimestamp = originalLinks[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: TrackClickInput = {
      link_id: linkId
    };

    await trackClick(input);

    // Verify timestamp was updated
    const updatedLinks = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, linkId))
      .execute();

    expect(updatedLinks[0].updated_at).toBeInstanceOf(Date);
    expect(updatedLinks[0].updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error for non-existent link', async () => {
    const input: TrackClickInput = {
      link_id: 999999 // Non-existent ID
    };

    expect(trackClick(input)).rejects.toThrow(/Link with ID 999999 not found/i);
  });

  it('should throw error for inactive link', async () => {
    const { userId } = await createTestUserAndLink();

    // Create inactive link
    const inactiveLinkResult = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Inactive Link',
        url: 'https://inactive.com',
        click_count: 10,
        is_active: false, // Inactive link
        order_index: 2
      })
      .returning()
      .execute();

    const input: TrackClickInput = {
      link_id: inactiveLinkResult[0].id
    };

    expect(trackClick(input)).rejects.toThrow(/Link with ID \d+ is not active/i);

    // Verify click count was not incremented
    const links = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, inactiveLinkResult[0].id))
      .execute();

    expect(links[0].click_count).toBe(10); // Should remain unchanged
  });

  it('should work with large click counts', async () => {
    const { userId } = await createTestUserAndLink();

    // Create link with large click count
    const largeLinkResult = await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Popular Link',
        url: 'https://popular.com',
        click_count: 999999,
        is_active: true,
        order_index: 3
      })
      .returning()
      .execute();

    const input: TrackClickInput = {
      link_id: largeLinkResult[0].id
    };

    const result = await trackClick(input);

    expect(result.success).toBe(true);
    expect(result.click_count).toBe(1000000);

    // Verify database update
    const links = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, largeLinkResult[0].id))
      .execute();

    expect(links[0].click_count).toBe(1000000);
  });
});