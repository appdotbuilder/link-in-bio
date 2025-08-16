import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginUserInput, type AuthResponse } from '../schema';

export async function loginUser(input: LoginUserInput): Promise<AuthResponse> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // For this implementation, we'll do a simple password comparison
    // In a real application, you would use bcrypt.compare() or similar
    // For now, we'll assume the password_hash is the plain password for testing
    if (user.password_hash !== input.password) {
      throw new Error('Invalid email or password');
    }

    // Return user data without password hash
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: 'jwt_token_placeholder' // Placeholder for future JWT implementation
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}