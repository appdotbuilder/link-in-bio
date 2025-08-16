import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateUserProfileInput, type User } from '../schema';

export const updateUserProfile = async (input: UpdateUserProfileInput): Promise<User> => {
  try {
    // Check if user exists first
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.display_name !== undefined) {
      updateData['display_name'] = input.display_name;
    }

    if (input.bio !== undefined) {
      updateData['bio'] = input.bio;
    }

    if (input.avatar_url !== undefined) {
      updateData['avatar_url'] = input.avatar_url;
    }

    // Update the user profile
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
};