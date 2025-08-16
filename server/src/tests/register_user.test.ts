import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: RegisterUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  display_name: 'Test User',
  bio: 'This is a test user bio'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await registerUser(testInput);

    // Validate returned user data
    expect(result.user.username).toEqual('testuser');
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.display_name).toEqual('Test User');
    expect(result.user.bio).toEqual('This is a test user bio');
    expect(result.user.avatar_url).toBeNull();
    expect(result.user.id).toBeGreaterThan(0);
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    expect(result.token).toBeUndefined();
  });

  it('should save user to database with hashed password', async () => {
    const result = await registerUser(testInput);

    // Query database directly to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    
    expect(savedUser.username).toEqual('testuser');
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.display_name).toEqual('Test User');
    expect(savedUser.bio).toEqual('This is a test user bio');
    expect(savedUser.avatar_url).toBeNull();
    expect(savedUser.password_hash).toEqual('hashed_testpassword123');
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should handle minimal input with optional fields', async () => {
    const minimalInput: RegisterUserInput = {
      username: 'minimal_user',
      email: 'minimal@example.com',
      password: 'password123'
      // display_name and bio are optional
    };

    const result = await registerUser(minimalInput);

    expect(result.user.username).toEqual('minimal_user');
    expect(result.user.email).toEqual('minimal@example.com');
    expect(result.user.display_name).toBeNull();
    expect(result.user.bio).toBeNull();
    expect(result.user.avatar_url).toBeNull();
    expect(result.user.id).toBeGreaterThan(0);
  });

  it('should reject duplicate username', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register another user with same username
    const duplicateUsernameInput: RegisterUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'password123',
      display_name: 'Different User',
      bio: 'Different bio'
    };

    await expect(registerUser(duplicateUsernameInput))
      .rejects.toThrow(/username already exists/i);
  });

  it('should reject duplicate email', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register another user with same email
    const duplicateEmailInput: RegisterUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'password123',
      display_name: 'Different User',
      bio: 'Different bio'
    };

    await expect(registerUser(duplicateEmailInput))
      .rejects.toThrow(/email already exists/i);
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls: RegisterUserInput = {
      username: 'nulluser',
      email: 'null@example.com',
      password: 'password123',
      display_name: null,
      bio: null
    };

    const result = await registerUser(inputWithNulls);

    expect(result.user.username).toEqual('nulluser');
    expect(result.user.email).toEqual('null@example.com');
    expect(result.user.display_name).toBeNull();
    expect(result.user.bio).toBeNull();
    expect(result.user.avatar_url).toBeNull();
  });

  it('should create users with unique IDs', async () => {
    const user1Input: RegisterUserInput = {
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123',
      display_name: 'User One',
      bio: 'First user'
    };

    const user2Input: RegisterUserInput = {
      username: 'user2',
      email: 'user2@example.com',
      password: 'password456',
      display_name: 'User Two',
      bio: 'Second user'
    };

    const result1 = await registerUser(user1Input);
    const result2 = await registerUser(user2Input);

    expect(result1.user.id).not.toEqual(result2.user.id);
    expect(result1.user.username).toEqual('user1');
    expect(result2.user.username).toEqual('user2');
  });

  it('should set timestamps correctly', async () => {
    const beforeRegistration = new Date();
    
    const result = await registerUser(testInput);
    
    const afterRegistration = new Date();

    // Verify timestamps are within reasonable range
    expect(result.user.created_at.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
    expect(result.user.created_at.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());
    expect(result.user.updated_at.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
    expect(result.user.updated_at.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());
  });
});