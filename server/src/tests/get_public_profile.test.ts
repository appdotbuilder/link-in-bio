import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, linksTable } from '../db/schema';
import { type GetPublicProfileInput } from '../schema';
import { getPublicProfile } from '../handlers/get_public_profile';
import { eq } from 'drizzle-orm';

describe('getPublicProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get public profile with active links ordered by order_index', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpass',
        display_name: 'Test User',
        bio: 'Test bio for user',
        avatar_url: 'https://example.com/avatar.jpg'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test links with different order indices
    await db.insert(linksTable)
      .values([
        {
          user_id: userId,
          title: 'Second Link',
          url: 'https://second.com',
          icon: 'link',
          click_count: 10,
          is_active: true,
          order_index: 2
        },
        {
          user_id: userId,
          title: 'First Link',
          url: 'https://first.com',
          icon: 'globe',
          click_count: 25,
          is_active: true,
          order_index: 1
        },
        {
          user_id: userId,
          title: 'Inactive Link',
          url: 'https://inactive.com',
          icon: 'disabled',
          click_count: 5,
          is_active: false,
          order_index: 0
        },
        {
          user_id: userId,
          title: 'Third Link',
          url: 'https://third.com',
          icon: null,
          click_count: 0,
          is_active: true,
          order_index: 3
        }
      ])
      .execute();

    const input: GetPublicProfileInput = {
      username: 'testuser'
    };

    const result = await getPublicProfile(input);

    // Verify user data
    expect(result.username).toEqual('testuser');
    expect(result.display_name).toEqual('Test User');
    expect(result.bio).toEqual('Test bio for user');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');

    // Verify links are returned in correct order and only active ones
    expect(result.links).toHaveLength(3);
    expect(result.links[0].title).toEqual('First Link');
    expect(result.links[0].url).toEqual('https://first.com');
    expect(result.links[0].icon).toEqual('globe');
    expect(result.links[0].click_count).toEqual(25);

    expect(result.links[1].title).toEqual('Second Link');
    expect(result.links[1].url).toEqual('https://second.com');
    expect(result.links[1].icon).toEqual('link');
    expect(result.links[1].click_count).toEqual(10);

    expect(result.links[2].title).toEqual('Third Link');
    expect(result.links[2].url).toEqual('https://third.com');
    expect(result.links[2].icon).toEqual(null);
    expect(result.links[2].click_count).toEqual(0);

    // Verify inactive link is not included
    const inactiveLinkTitles = result.links.map(link => link.title);
    expect(inactiveLinkTitles).not.toContain('Inactive Link');
  });

  it('should get public profile with null display fields', async () => {
    // Create test user with minimal data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'minimaluser',
        email: 'minimal@example.com',
        password_hash: 'hashedpass',
        display_name: null,
        bio: null,
        avatar_url: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create one active link
    await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Only Link',
        url: 'https://only.com',
        icon: null,
        click_count: 42,
        is_active: true,
        order_index: 1
      })
      .execute();

    const input: GetPublicProfileInput = {
      username: 'minimaluser'
    };

    const result = await getPublicProfile(input);

    // Verify user data with null fields
    expect(result.username).toEqual('minimaluser');
    expect(result.display_name).toEqual(null);
    expect(result.bio).toEqual(null);
    expect(result.avatar_url).toEqual(null);

    // Verify links
    expect(result.links).toHaveLength(1);
    expect(result.links[0].title).toEqual('Only Link');
    expect(result.links[0].url).toEqual('https://only.com');
    expect(result.links[0].icon).toEqual(null);
    expect(result.links[0].click_count).toEqual(42);
  });

  it('should get public profile with no active links', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'nolinks',
        email: 'nolinks@example.com',
        password_hash: 'hashedpass',
        display_name: 'User With No Links',
        bio: 'I have no active links',
        avatar_url: 'https://example.com/nolinks.jpg'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create only inactive links
    await db.insert(linksTable)
      .values([
        {
          user_id: userId,
          title: 'Inactive Link 1',
          url: 'https://inactive1.com',
          icon: 'disabled',
          click_count: 0,
          is_active: false,
          order_index: 1
        },
        {
          user_id: userId,
          title: 'Inactive Link 2',
          url: 'https://inactive2.com',
          icon: 'disabled',
          click_count: 0,
          is_active: false,
          order_index: 2
        }
      ])
      .execute();

    const input: GetPublicProfileInput = {
      username: 'nolinks'
    };

    const result = await getPublicProfile(input);

    // Verify user data
    expect(result.username).toEqual('nolinks');
    expect(result.display_name).toEqual('User With No Links');
    expect(result.bio).toEqual('I have no active links');
    expect(result.avatar_url).toEqual('https://example.com/nolinks.jpg');

    // Verify no active links
    expect(result.links).toHaveLength(0);
  });

  it('should throw error for non-existent user', async () => {
    const input: GetPublicProfileInput = {
      username: 'nonexistentuser'
    };

    expect(getPublicProfile(input)).rejects.toThrow(/user with username "nonexistentuser" not found/i);
  });

  it('should not expose sensitive user information', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        username: 'secureuser',
        email: 'secure@example.com',
        password_hash: 'supersecrethashedpass',
        display_name: 'Secure User',
        bio: 'Security focused user',
        avatar_url: 'https://example.com/secure.jpg'
      })
      .execute();

    const input: GetPublicProfileInput = {
      username: 'secureuser'
    };

    const result = await getPublicProfile(input);

    // Verify sensitive information is not included
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('password_hash');
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');

    // Verify only public fields are present
    expect(result.username).toEqual('secureuser');
    expect(result.display_name).toEqual('Secure User');
    expect(result.bio).toEqual('Security focused user');
    expect(result.avatar_url).toEqual('https://example.com/secure.jpg');
    expect(result.links).toEqual([]);
  });

  it('should verify user exists in database after profile creation', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'verifyuser',
        email: 'verify@example.com',
        password_hash: 'hashedpass',
        display_name: 'Verify User',
        bio: 'User to verify',
        avatar_url: 'https://example.com/verify.jpg'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test link
    await db.insert(linksTable)
      .values({
        user_id: userId,
        title: 'Verify Link',
        url: 'https://verify.com',
        icon: 'check',
        click_count: 15,
        is_active: true,
        order_index: 1
      })
      .execute();

    const input: GetPublicProfileInput = {
      username: 'verifyuser'
    };

    const result = await getPublicProfile(input);

    // Verify the user exists in database by querying directly
    const usersInDb = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'verifyuser'))
      .execute();

    expect(usersInDb).toHaveLength(1);
    expect(usersInDb[0].username).toEqual(result.username);
    expect(usersInDb[0].display_name).toEqual(result.display_name);
    expect(usersInDb[0].bio).toEqual(result.bio);
    expect(usersInDb[0].avatar_url).toEqual(result.avatar_url);

    // Verify links in database
    const linksInDb = await db.select()
      .from(linksTable)
      .where(eq(linksTable.user_id, userId))
      .execute();

    expect(linksInDb).toHaveLength(1);
    expect(linksInDb[0].title).toEqual(result.links[0].title);
    expect(linksInDb[0].url).toEqual(result.links[0].url);
    expect(linksInDb[0].click_count).toEqual(result.links[0].click_count);
  });
});