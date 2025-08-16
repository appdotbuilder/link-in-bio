import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { type CreateLinkInput } from '../schema';
import { createLink } from '../handlers/create_link';
import { eq } from 'drizzle-orm';

describe('createLink', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        display_name: 'Test User',
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a link with all fields', async () => {
    const testInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'My Website',
      url: 'https://example.com',
      icon: 'globe',
      order_index: 5
    };

    const result = await createLink(testInput);

    // Verify returned data
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('My Website');
    expect(result.url).toEqual('https://example.com');
    expect(result.icon).toEqual('globe');
    expect(result.click_count).toEqual(0);
    expect(result.is_active).toEqual(true);
    expect(result.order_index).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a link with minimal fields', async () => {
    const testInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'Simple Link',
      url: 'https://simple.com'
    };

    const result = await createLink(testInput);

    expect(result.title).toEqual('Simple Link');
    expect(result.url).toEqual('https://simple.com');
    expect(result.icon).toBeNull();
    expect(result.order_index).toEqual(0); // Should default to 0 for first link
  });

  it('should save link to database', async () => {
    const testInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'Database Test',
      url: 'https://database.com',
      icon: 'database'
    };

    const result = await createLink(testInput);

    // Query database to verify link was saved
    const savedLinks = await db.select()
      .from(linksTable)
      .where(eq(linksTable.id, result.id))
      .execute();

    expect(savedLinks).toHaveLength(1);
    expect(savedLinks[0].title).toEqual('Database Test');
    expect(savedLinks[0].url).toEqual('https://database.com');
    expect(savedLinks[0].icon).toEqual('database');
    expect(savedLinks[0].user_id).toEqual(testUserId);
  });

  it('should auto-increment order_index when not provided', async () => {
    // Create first link without order_index
    const firstInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'First Link',
      url: 'https://first.com'
    };

    const firstResult = await createLink(firstInput);
    expect(firstResult.order_index).toEqual(0);

    // Create second link without order_index
    const secondInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'Second Link',
      url: 'https://second.com'
    };

    const secondResult = await createLink(secondInput);
    expect(secondResult.order_index).toEqual(1);

    // Create third link with explicit order_index
    const thirdInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'Third Link',
      url: 'https://third.com',
      order_index: 10
    };

    const thirdResult = await createLink(thirdInput);
    expect(thirdResult.order_index).toEqual(10);

    // Create fourth link without order_index - should be 11 (max + 1)
    const fourthInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'Fourth Link',
      url: 'https://fourth.com'
    };

    const fourthResult = await createLink(fourthInput);
    expect(fourthResult.order_index).toEqual(11);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateLinkInput = {
      user_id: 99999, // Non-existent user ID
      title: 'Invalid User Link',
      url: 'https://invalid.com'
    };

    await expect(createLink(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should handle multiple users with separate order sequences', async () => {
    // Create second test user
    const secondUserDbResult = await db.insert(usersTable)
      .values({
        username: 'seconduser',
        email: 'second@example.com',
        password_hash: 'hashedpassword456',
      })
      .returning()
      .execute();

    const secondUserId = secondUserDbResult[0].id;

    // Create link for first user
    const firstUserInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'User 1 Link',
      url: 'https://user1.com'
    };

    const firstUserLinkResult = await createLink(firstUserInput);
    expect(firstUserLinkResult.order_index).toEqual(0);

    // Create link for second user
    const secondUserInput: CreateLinkInput = {
      user_id: secondUserId,
      title: 'User 2 Link',
      url: 'https://user2.com'
    };

    const secondUserLinkResult = await createLink(secondUserInput);
    expect(secondUserLinkResult.order_index).toEqual(0); // Should also start at 0

    // Create another link for first user
    const anotherFirstUserInput: CreateLinkInput = {
      user_id: testUserId,
      title: 'User 1 Second Link',
      url: 'https://user1-second.com'
    };

    const anotherFirstUserResult = await createLink(anotherFirstUserInput);
    expect(anotherFirstUserResult.order_index).toEqual(1);
  });
});