import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  display_name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// User registration input schema
export const registerUserInputSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  display_name: z.string().nullable().optional(),
  bio: z.string().nullable().optional()
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// User login input schema
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// User profile update schema
export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  display_name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

// Link schema
export const linkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  url: z.string(),
  icon: z.string().nullable(),
  click_count: z.number().int(),
  is_active: z.boolean(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Link = z.infer<typeof linkSchema>;

// Create link input schema
export const createLinkInputSchema = z.object({
  user_id: z.number(),
  title: z.string().min(1).max(100),
  url: z.string().url(),
  icon: z.string().nullable().optional(),
  order_index: z.number().int().nonnegative().optional()
});

export type CreateLinkInput = z.infer<typeof createLinkInputSchema>;

// Update link input schema
export const updateLinkInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  icon: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  order_index: z.number().int().nonnegative().optional()
});

export type UpdateLinkInput = z.infer<typeof updateLinkInputSchema>;

// Public profile schema (user data without sensitive info)
export const publicProfileSchema = z.object({
  username: z.string(),
  display_name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  links: z.array(z.object({
    id: z.number(),
    title: z.string(),
    url: z.string(),
    icon: z.string().nullable(),
    click_count: z.number().int()
  }))
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;

// Get public profile input schema
export const getPublicProfileInputSchema = z.object({
  username: z.string()
});

export type GetPublicProfileInput = z.infer<typeof getPublicProfileInputSchema>;

// Track click input schema
export const trackClickInputSchema = z.object({
  link_id: z.number()
});

export type TrackClickInput = z.infer<typeof trackClickInputSchema>;

// Auth response schema
export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string().optional() // For future JWT implementation
});

export type AuthResponse = z.infer<typeof authResponseSchema>;