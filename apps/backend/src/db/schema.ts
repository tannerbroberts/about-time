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
  // Template linking and versioning
  originTemplateId: varchar('origin_template_id', { length: 255 }),
  originAuthorId: uuid('origin_author_id'),
  linkType: varchar('link_type', { length: 20 }).notNull().default('original'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
  visibility: varchar('visibility', { length: 10 }).notNull().default('private'),
  allowForking: boolean('allow_forking').notNull().default(true),
  allowLiveLinking: boolean('allow_live_linking').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_templates_user_id').on(table.userId),
  userTypeIdx: index('idx_templates_user_type').on(table.userId, table.templateType),
  updatedIdx: index('idx_templates_updated').on(table.userId, table.updatedAt),
  publicIdx: index('idx_templates_public').on(table.isPublic, table.publishedAt),
  publicTypeIdx: index('idx_templates_public_type').on(table.isPublic, table.templateType, table.publishedAt),
  originTemplateIdx: index('idx_templates_origin').on(table.originTemplateId),
  originAuthorIdx: index('idx_templates_origin_author').on(table.originAuthorId),
  linkTypeCheck: sql`CHECK (link_type IN ('original', 'forked', 'live-linked'))`,
  visibilityCheck: sql`CHECK (visibility IN ('private', 'unlisted', 'public'))`,
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
// Libraries Table
// ============================================================================

export const libraries = pgTable('libraries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  laneTemplateId: varchar('lane_template_id', { length: 255 }).references(() => templates.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  visibility: varchar('visibility', { length: 10 }).notNull().default('private'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  templateCount: integer('template_count').notNull().default(0),
}, (table) => ({
  ownerIdx: index('idx_libraries_owner').on(table.ownerId),
  laneIdx: index('idx_libraries_lane').on(table.laneTemplateId),
  visibilityCheck: sql`CHECK (visibility IN ('private', 'unlisted', 'public'))`,
}));

// ============================================================================
// Library Memberships Table (Many-to-Many)
// ============================================================================

export const libraryMemberships = pgTable('library_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  libraryId: uuid('library_id').notNull().references(() => libraries.id, { onDelete: 'cascade' }),
  templateId: varchar('template_id', { length: 255 }).notNull().references(() => templates.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  addedBy: uuid('added_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notes: text('notes'),
  tags: text('tags').array(),
  order: integer('order'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: integer('usage_count').notNull().default(0),
}, (table) => ({
  libraryIdx: index('idx_library_memberships_library').on(table.libraryId),
  templateIdx: index('idx_library_memberships_template').on(table.templateId),
  uniqueMembership: unique('unique_library_template').on(table.libraryId, table.templateId),
}));

// ============================================================================
// Template Variables Table (for confidence bounds)
// ============================================================================

export const templateVariables = pgTable('template_variables', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: varchar('template_id', { length: 255 }).notNull().references(() => templates.id, { onDelete: 'cascade' }),
  variableName: varchar('variable_name', { length: 255 }).notNull(),
  variableType: varchar('variable_type', { length: 10 }).notNull(), // 'produce' or 'consume'
  nominalValue: bigint('nominal_value', { mode: 'number' }).notNull(),
  lowerBound: bigint('lower_bound', { mode: 'number' }),
  upperBound: bigint('upper_bound', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  templateIdx: index('idx_template_variables_template').on(table.templateId),
  nameIdx: index('idx_template_variables_name').on(table.variableName),
  uniqueTemplateVar: unique('unique_template_variable').on(table.templateId, table.variableName, table.variableType),
}));

// ============================================================================
// Composite Unit Definitions Table
// ============================================================================

export const compositeUnitDefinitions = pgTable('composite_unit_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  version: integer('version').notNull().default(1),
  composition: jsonb('composition').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  originCompositeId: uuid('origin_composite_id'),
  linkType: varchar('link_type', { length: 20 }).notNull().default('original'),
  changelog: text('changelog'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  authorIdx: index('idx_composites_author').on(table.authorId),
  nameIdx: index('idx_composites_name').on(table.name),
  originIdx: index('idx_composites_origin').on(table.originCompositeId),
  uniqueComposite: unique('unique_composite_name_author_version').on(table.name, table.authorId, table.version),
  linkTypeCheck: sql`CHECK (link_type IN ('original', 'forked', 'live-linked'))`,
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

export type Library = typeof libraries.$inferSelect;
export type NewLibrary = typeof libraries.$inferInsert;

export type LibraryMembership = typeof libraryMemberships.$inferSelect;
export type NewLibraryMembership = typeof libraryMemberships.$inferInsert;

export type TemplateVariable = typeof templateVariables.$inferSelect;
export type NewTemplateVariable = typeof templateVariables.$inferInsert;

export type CompositeUnitDefinition = typeof compositeUnitDefinitions.$inferSelect;
export type NewCompositeUnitDefinition = typeof compositeUnitDefinitions.$inferInsert;
