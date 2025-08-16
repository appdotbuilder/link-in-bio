import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { getUserLinks } from '../handlers/get_user_links';

describe('getUserLinks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return links for a user ordered by order_index', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test links with different order_index values
    await db.insert(linksTable)
      .values([
        {
          user_id: userId,
          title: 'Third Link',
          url: 'https://third.com',
          icon: 'link',
          click_count: 5,
          is_active: true,
          order_index: 2
        },
        {
          user_id: userId,
          title: 'First Link',
          url: 'https://first.com',
          icon: 'star',
          click_count: 10,
          is_active: true,
          order_index: 0
        },
        {
          user_id: userId,
          title: 'Second Link',
          url: 'https://second.com',
          icon: 'heart',
          click_count: 8,
          is_active: false,
          order_index: 1
        }
      ])
      .execute();

    const result = await getUserLinks(userId);

    // Should return 3 links
    expect(result).toHaveLength(3);

    // Should be ordered by order_index (ascending)
    expect(result[0].title).toEqual('First Link');
    expect(result[0].order_index).toEqual(0);
    expect(result[1].title).toEqual('Second Link');
    expect(result[1].order_index).toEqual(1);
    expect(result[2].title).toEqual('Third Link');
    expect(result[2].order_index).toEqual(2);

    // Verify all fields are returned correctly
    expect(result[0]).toMatchObject({
      user_id: userId,
      title: 'First Link',
      url: 'https://first.com',
      icon: 'star',
      click_count: 10,
      is_active: true,
      order_index: 0
    });
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array for user with no links', async () => {
    // Create a test user with no links
    const userResult = await db.insert(usersTable)
      .values({
        username: 'usernolinks',
        email: 'nolinks@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const result = await getUserLinks(userId);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return links for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create links for both users
    await db.insert(linksTable)
      .values([
        {
          user_id: user1Id,
          title: 'User1 Link',
          url: 'https://user1.com',
          order_index: 0
        },
        {
          user_id: user2Id,
          title: 'User2 Link',
          url: 'https://user2.com',
          order_index: 0
        }
      ])
      .execute();

    // Get links for user1
    const result = await getUserLinks(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User1 Link');
    expect(result[0].user_id).toEqual(user1Id);
  });

  it('should handle inactive links in the result', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create both active and inactive links
    await db.insert(linksTable)
      .values([
        {
          user_id: userId,
          title: 'Active Link',
          url: 'https://active.com',
          is_active: true,
          order_index: 0
        },
        {
          user_id: userId,
          title: 'Inactive Link',
          url: 'https://inactive.com',
          is_active: false,
          order_index: 1
        }
      ])
      .execute();

    const result = await getUserLinks(userId);

    // Should return both active and inactive links
    expect(result).toHaveLength(2);
    expect(result[0].is_active).toEqual(true);
    expect(result[1].is_active).toEqual(false);
  });

  it('should handle links with null icon values', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a link with null icon
    await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Link No Icon',
        url: 'https://noicon.com',
        icon: null,
        order_index: 0
      })
      .execute();

    const result = await getUserLinks(userId);

    expect(result).toHaveLength(1);
    expect(result[0].icon).toBeNull();
    expect(result[0].title).toEqual('Link No Icon');
  });
});