/**
 * Library types for template organization
 */

export type LibraryVisibility = 'private' | 'unlisted' | 'public';

/**
 * Library - A collection of templates for organization and scoping
 */
export interface Library {
  id: string;
  name: string;
  description: string | null;
  laneTemplateId: string | null;  // null = global library
  ownerId: string;
  visibility: LibraryVisibility;
  createdAt: Date;
  updatedAt: Date;
  templateCount: number;
}

/**
 * Library Membership - Many-to-many relationship between libraries and templates
 */
export interface LibraryMembership {
  id: string;
  libraryId: string;
  templateId: string;
  addedAt: Date;
  addedBy: string;
  notes: string | null;
  tags: string[] | null;
  order: number | null;
  lastUsedAt: Date | null;
  usageCount: number;
}

/**
 * DTO for creating a new library
 */
export interface CreateLibraryDTO {
  name: string;
  description?: string;
  laneTemplateId?: string;
  visibility?: LibraryVisibility;
}

/**
 * DTO for updating library metadata
 */
export interface UpdateLibraryDTO {
  name?: string;
  description?: string;
  visibility?: LibraryVisibility;
}

/**
 * DTO for adding template to library
 */
export interface AddTemplateToLibraryDTO {
  libraryId: string;
  templateId: string;
  notes?: string;
  tags?: string[];
  order?: number;
}
