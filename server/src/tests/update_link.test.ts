import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { type UpdateLinkInput } from '../schema';
import { updateLink } from '../handlers/update_link';
import { eq } from 'drizzle-orm';

describe('updateLink', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testLinkId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create a test link
    const linkResult = await db.insert(linksTable)
      .values({
        user_id: testUserId,
        title: 'Original Title',
        url: 'https://original.com',
        icon: 'original-icon',
        click_count: 5,
        is_active: true,
        order_index: 1
      })
      .returning()
      .execute();

    testLinkId = linkResult[0].id;
  });

  it('should update link title', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      title: 'Updated Title'
    };

    const result = await updateLink(input);

    expect(result.id).toEqual(testLinkId);
    expect(result.title).toEqual('Updated Title');
    expect(result.url).toEqual('https://original.com'); // Should remain unchanged
    expect(result.icon).toEqual('original-icon'); // Should remain unchanged
    expect(result.click_count).toEqual(5); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.order_index).toEqual(1); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update link URL', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      url: 'https://updated.com'
    };

    const result = await updateLink(input);

    expect(result.id).toEqual(testLinkId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.url).toEqual('https://updated.com');
    expect(result.icon).toEqual('original-icon'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update link icon to new value', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      icon: 'new-icon'
    };

    const result = await updateLink(input);

    expect(result.id).toEqual(testLinkId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.icon).toEqual('new-icon');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update link icon to null', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      icon: null
    };

    const result = await updateLink(input);

    expect(result.id).toEqual(testLinkId);
    expect(result.icon).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update link active status', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      is_active: false
    };

    const result = await updateLink(input);

    expect(result.id).toEqual(testLinkId);
    expect(result.is_active).toEqual(false);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update link order index', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      order_index: 10
    };

    const result = await updateLink(input);

    expect(result.id).toEqual(testLinkId);
    expect(result.order_index).toEqual(10);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      title: 'Multi Update Title',
      url: 'https://multiupdate.com',
      icon: 'multi-icon',
      is_active: false,
      order_index: 5
    };

    const result = await updateLink(input);

    expect(result.id).toEqual(testLinkId);
    expect(result.title).toEqual('Multi Update Title');
    expect(result.url).toEqual('https://multiupdate.com');
    expect(result.icon).toEqual('multi-icon');
    expect(result.is_active).toEqual(false);
    expect(result.order_index).toEqual(5);
    expect(result.click_count).toEqual(5); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const beforeUpdate = new Date();
    
    const input: UpdateLinkInput = {
      id: testLinkId,
      title: 'Timestamp Test'
    };

    const result = await updateLink(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  it('should save changes to database', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId,
      title: 'Database Persistence Test',
      url: 'https://persistence.com'
    };

    await updateLink(input);

    // Verify changes were saved to database
    const links = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, testLinkId))
      .execute();

    expect(links).toHaveLength(1);
    expect(links[0].title).toEqual('Database Persistence Test');
    expect(links[0].url).toEqual('https://persistence.com');
    expect(links[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when link does not exist', async () => {
    const input: UpdateLinkInput = {
      id: 99999, // Non-existent ID
      title: 'Should Fail'
    };

    await expect(updateLink(input)).rejects.toThrow(/Link with id 99999 not found/i);
  });

  it('should handle updating with no optional fields provided', async () => {
    const input: UpdateLinkInput = {
      id: testLinkId
      // No optional fields provided
    };

    const result = await updateLink(input);

    // Should only update the updated_at timestamp
    expect(result.id).toEqual(testLinkId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.url).toEqual('https://original.com'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});