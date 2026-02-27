/**
 * Database schema using Drizzle ORM
 */

import { pgTable, uuid, varchar, timestamp, jsonb, bigint, text, integer, index, unique, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { Template } from '@tannerbroberts/about-time-core';

// ============================================================================
// Users Table
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }),
  oauthProvider: varchar('oauth_provider', { length: 50 }),
  oauthId: varchar('oauth_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  oauthIdx: index('idx_users_oauth').on(table.oauthProvider, table.oauthId),
}));

// ============================================================================
// Sessions Table (Lucia Auth)
// ============================================================================

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt),
}));

// ============================================================================
// Templates Table
// ============================================================================

export const templates = pgTable('templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateData: jsonb('template_data').$type<Template>().notNull(),
  templateType: varchar('template_type', { length: 10 }).notNull(),
  intent: text('intent').notNull(),
  estimatedDuration: bigint('estimated_duration', { mode: 'number' }).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  authorDisplayName: varchar('author_display_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_templates_user_id').on(table.userId),
  userTypeIdx: index('idx_templates_user_type').on(table.userId, table.templateType),
  updatedIdx: index('idx_templates_updated').on(table.userId, table.updatedAt),
  publicIdx: index('idx_templates_public').on(table.isPublic, table.publishedAt),
  publicTypeIdx: index('idx_templates_public_type').on(table.isPublic, table.templateType, table.publishedAt),
}));

// ============================================================================
// Template Relationships Table
// ============================================================================

export const templateRelationships = pgTable('template_relationships', {
  id: varchar('id', { length: 255 }).primaryKey(),
  parentTemplateId: varchar('parent_template_id', { length: 255 }).notNull().references(() => templates.id, { onDelete: 'cascade' }),
  childTemplateId: varchar('child_template_id', { length: 255 }).notNull().references(() => templates.id, { onDelete: 'cascade' }),
  offset: bigint('offset', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  parentIdx: index('idx_relationships_parent').on(table.parentTemplateId),
  childIdx: index('idx_relationships_child').on(table.childTemplateId),
}));

// ============================================================================
// Schedule Lanes Table
// ============================================================================

export const scheduleLanes = pgTable('schedule_lanes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dateKey: varchar('date_key', { length: 10 }).notNull(),
  laneTemplateId: varchar('lane_template_id', { length: 255 }).notNull().references(() => templates.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index('idx_schedule_user_date').on(table.userId, table.dateKey),
  uniqueUserDate: unique('unique_user_date').on(table.userId, table.dateKey),
}));

// ============================================================================
// Daily Goals Table
// ============================================================================

export const dailyGoals = pgTable('daily_goals', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  calories: integer('calories').notNull(),
  proteinG: integer('protein_g').notNull(),
  carbsG: integer('carbs_g').notNull(),
  fatsG: integer('fats_g').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Daily State Table (Execute feature)
// ============================================================================

export const dailyState = pgTable('daily_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dateKey: varchar('date_key', { length: 10 }).notNull(),
  completedMealIds: text('completed_meal_ids').array().notNull().default([]),
  skippedMealIds: text('skipped_meal_ids').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index('idx_daily_state_user_date').on(table.userId, table.dateKey),
  uniqueUserDate: unique('unique_user_daily_state').on(table.userId, table.dateKey),
}));

// ============================================================================
// Type exports for Drizzle ORM
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type DbTemplate = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type TemplateRelationship = typeof templateRelationships.$inferSelect;
export type NewTemplateRelationship = typeof templateRelationships.$inferInsert;

export type ScheduleLane = typeof scheduleLanes.$inferSelect;
export type NewScheduleLane = typeof scheduleLanes.$inferInsert;

export type DailyGoals = typeof dailyGoals.$inferSelect;
export type NewDailyGoals = typeof dailyGoals.$inferInsert;

export type DailyState = typeof dailyState.$inferSelect;
export type NewDailyState = typeof dailyState.$inferInsert;
