import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  display_name: text('display_name'), // Nullable by default
  bio: text('bio'), // Nullable by default
  avatar_url: text('avatar_url'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const linksTable = pgTable('links', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  icon: text('icon'), // Nullable by default
  click_count: integer('click_count').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  order_index: integer('order_index').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  links: many(linksTable),
}));

export const linksRelations = relations(linksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [linksTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect; // For SELECT operations
export type NewUser = typeof usersTable.$inferInsert; // For INSERT operations

export type Link = typeof linksTable.$inferSelect; // For SELECT operations
export type NewLink = typeof linksTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  links: linksTable 
};

export const schemas = {
  usersTable,
  linksTable,
  usersRelations,
  linksRelations,
};