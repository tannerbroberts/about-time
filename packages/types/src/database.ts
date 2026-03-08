/**
 * Database entity types for PostgreSQL tables
 */

import type { Template } from '@tannerbroberts/about-time-core';

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string | null;
  displayName: string | null;
  oauthProvider: 'google' | 'github' | null;
  oauthId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface DbTemplate {
  id: string;
  userId: string;
  templateData: Template; // Stored as JSONB
  templateType: 'busy' | 'lane';
  intent: string;
  estimatedDuration: number; // bigint in nanoseconds
  createdAt: Date;
  updatedAt: Date;
}

export interface DbTemplateRelationship {
  id: string;
  parentTemplateId: string;
  childTemplateId: string;
  offset: number; // bigint in nanoseconds
  createdAt: Date;
}

export interface DbScheduleLane {
  id: string;
  userId: string;
  dateKey: string; // 'YYYY-MM-DD'
  laneTemplateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbDailyGoals {
  userId: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  updatedAt: Date;
}

export interface DbDailyState {
  id: string;
  userId: string;
  dateKey: string; // 'YYYY-MM-DD'
  completedMealIds: string[];
  skippedMealIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DbLibrary {
  id: string;
  name: string;
  description: string | null;
  laneTemplateId: string | null;
  ownerId: string;
  visibility: 'private' | 'unlisted' | 'public';
  createdAt: Date;
  updatedAt: Date;
  templateCount: number;
}

export interface DbLibraryMembership {
  id: string;
  libraryId: string;
  templateId: string;
  addedAt: Date;
  addedBy: string;
  notes: string | null;
  tags: string[] | null;
  order: number | null;
}
