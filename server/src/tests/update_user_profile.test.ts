import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';

describe('updateUserProfile', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        display_name: 'Original Name',
        bio: 'Original bio',
        avatar_url: 'https://example.com/original.jpg'
      })
      .returning()
      .execute();
    
    testUserId = users[0].id;
  });

  afterEach(resetDB);

  it('should update display_name only', async () => {
    const input: UpdateUserProfileInput = {
      id: testUserId,
      display_name: 'Updated Display Name'
    };

    const result = await updateUserProfile(input);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toEqual('Updated Display Name');
    expect(result.bio).toEqual('Original bio'); // Should remain unchanged
    expect(result.avatar_url).toEqual('https://example.com/original.jpg'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update bio only', async () => {
    const input: UpdateUserProfileInput = {
      id: testUserId,
      bio: 'Updated bio content'
    };

    const result = await updateUserProfile(input);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toEqual('Original Name'); // Should remain unchanged
    expect(result.bio).toEqual('Updated bio content');
    expect(result.avatar_url).toEqual('https://example.com/original.jpg'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update avatar_url only', async () => {
    const input: UpdateUserProfileInput = {
      id: testUserId,
      avatar_url: 'https://example.com/new-avatar.jpg'
    };

    const result = await updateUserProfile(input);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toEqual('Original Name'); // Should remain unchanged
    expect(result.bio).toEqual('Original bio'); // Should remain unchanged
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update all fields at once', async () => {
    const input: UpdateUserProfileInput = {
      id: testUserId,
      display_name: 'Completely New Name',
      bio: 'Completely new bio',
      avatar_url: 'https://example.com/completely-new.jpg'
    };

    const result = await updateUserProfile(input);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toEqual('Completely New Name');
    expect(result.bio).toEqual('Completely new bio');
    expect(result.avatar_url).toEqual('https://example.com/completely-new.jpg');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const input: UpdateUserProfileInput = {
      id: testUserId,
      display_name: null,
      bio: null,
      avatar_url: null
    };

    const result = await updateUserProfile(input);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateUserProfileInput = {
      id: testUserId,
      display_name: 'Database Test Name',
      bio: 'Database test bio'
    };

    await updateUserProfile(input);

    // Verify changes were persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].display_name).toEqual('Database Test Name');
    expect(users[0].bio).toEqual('Database test bio');
    expect(users[0].avatar_url).toEqual('https://example.com/original.jpg'); // Should remain unchanged
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update timestamp even with no field changes', async () => {
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateUserProfileInput = {
      id: testUserId
    };

    const result = await updateUserProfile(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUser[0].updated_at.getTime());
  });

  it('should throw error for non-existent user', async () => {
    const input: UpdateUserProfileInput = {
      id: 99999, // Non-existent user ID
      display_name: 'New Name'
    };

    await expect(updateUserProfile(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should preserve other user fields', async () => {
    const input: UpdateUserProfileInput = {
      id: testUserId,
      display_name: 'Updated Name'
    };

    const result = await updateUserProfile(input);

    // Verify core user fields remain unchanged
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('hashed_password');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});