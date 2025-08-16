import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type AuthResponse } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function registerUser(input: RegisterUserInput): Promise<AuthResponse> {
  try {
    // 1. Check if username or email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(
        or(
          eq(usersTable.username, input.username),
          eq(usersTable.email, input.email)
        )
      )
      .execute();

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === input.username) {
        throw new Error('Username already exists');
      }
      if (existingUser.email === input.email) {
        throw new Error('Email already exists');
      }
    }

    // 2. Hash the password (placeholder for now - in production use bcrypt)
    const password_hash = `hashed_${input.password}`;

    // 3. Create new user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash,
        display_name: input.display_name || null,
        bio: input.bio || null,
        avatar_url: null
      })
      .returning()
      .execute();

    const newUser = result[0];

    // 4. Return user data without password hash
    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        display_name: newUser.display_name,
        bio: newUser.bio,
        avatar_url: newUser.avatar_url,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      token: undefined // Optional JWT token for future implementation
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
}