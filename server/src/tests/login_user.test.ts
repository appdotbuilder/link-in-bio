import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'test_password_123', // Using plain password for simplicity in tests
  display_name: 'Test User',
  bio: 'Test user bio',
  avatar_url: null
};

const validLoginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'test_password_123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(validLoginInput);

    // Verify response structure
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();

    // Verify user data (without password hash)
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.username).toEqual(testUser.username);
    expect(result.user.display_name).toEqual(testUser.display_name);
    expect(result.user.bio).toEqual(testUser.bio);
    expect(result.user.avatar_url).toEqual(testUser.avatar_url);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Verify password hash is NOT included in response
    expect((result.user as any).password_hash).toBeUndefined();

    // Verify token is provided
    expect(result.token).toEqual('jwt_token_placeholder');
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'test_password_123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'wrong_password'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle empty email', async () => {
    const invalidInput: LoginUserInput = {
      email: '',
      password: 'test_password_123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle user with null display fields', async () => {
    // Create user with null optional fields
    const userWithNulls = {
      ...testUser,
      display_name: null,
      bio: null,
      avatar_url: null
    };

    await db.insert(usersTable)
      .values(userWithNulls)
      .execute();

    const result = await loginUser(validLoginInput);

    expect(result.user.display_name).toBeNull();
    expect(result.user.bio).toBeNull();
    expect(result.user.avatar_url).toBeNull();
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.username).toEqual(testUser.username);
  });

  it('should handle case-sensitive email matching', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const uppercaseEmailInput: LoginUserInput = {
      email: 'TEST@EXAMPLE.COM', // Different case
      password: 'test_password_123'
    };

    // Should fail since email is case-sensitive
    await expect(loginUser(uppercaseEmailInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should return user with correct data types', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(validLoginInput);

    // Verify data types
    expect(typeof result.user.id).toBe('number');
    expect(typeof result.user.username).toBe('string');
    expect(typeof result.user.email).toBe('string');
    expect(result.user.display_name === null || typeof result.user.display_name === 'string').toBe(true);
    expect(result.user.bio === null || typeof result.user.bio === 'string').toBe(true);
    expect(result.user.avatar_url === null || typeof result.user.avatar_url === 'string').toBe(true);
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    expect(typeof result.token).toBe('string');
  });
});