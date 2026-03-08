/**
 * Library API endpoints
 */

import { apiClient } from './client.js';
import type { Library, LibraryMembership, CreateLibraryDTO, UpdateLibraryDTO, AddTemplateToLibraryDTO } from '@about-time/types/library';
import type { Template } from '@tannerbroberts/about-time-core';

/**
 * Fetch all libraries for the current user
 */
export const fetchLibraries = async (): Promise<Library[]> => {
  const response = await apiClient.get<{ success: true; data: Library[] }>('/libraries');
  return response.data.data;
};

/**
 * Get single library by ID
 */
export const getLibrary = async (libraryId: string): Promise<Library> => {
  const response = await apiClient.get<{ success: true; data: Library }>(
    `/libraries/${libraryId}`
  );
  return response.data.data;
};

/**
 * Create new library
 */
export const createLibrary = async (data: CreateLibraryDTO): Promise<Library> => {
  const response = await apiClient.post<{ success: true; data: Library }>(
    '/libraries',
    data
  );
  return response.data.data;
};

/**
 * Update library metadata
 */
export const updateLibrary = async (
  libraryId: string,
  data: UpdateLibraryDTO
): Promise<Library> => {
  const response = await apiClient.put<{ success: true; data: Library }>(
    `/libraries/${libraryId}`,
    data
  );
  return response.data.data;
};

/**
 * Delete library
 */
export const deleteLibrary = async (libraryId: string): Promise<void> => {
  await apiClient.delete(`/libraries/${libraryId}`);
};

/**
 * Get templates in a library
 */
export const getLibraryTemplates = async (
  libraryId: string
): Promise<Array<{
  template: Template;
  membership: LibraryMembership;
}>> => {
  const response = await apiClient.get<{
    success: true;
    data: Array<{
      template: Template;
      membership: LibraryMembership;
    }>;
  }>(`/libraries/${libraryId}/templates`);
  return response.data.data;
};

/**
 * Add template to library
 */
export const addTemplateToLibrary = async (
  libraryId: string,
  data: Omit<AddTemplateToLibraryDTO, 'libraryId'>
): Promise<LibraryMembership> => {
  const response = await apiClient.post<{ success: true; data: LibraryMembership }>(
    `/libraries/${libraryId}/templates`,
    data
  );
  return response.data.data;
};

/**
 * Remove template from library
 */
export const removeTemplateFromLibrary = async (
  libraryId: string,
  templateId: string
): Promise<void> => {
  await apiClient.delete(`/libraries/${libraryId}/templates/${templateId}`);
};

/**
 * Update membership metadata (notes, tags, order)
 */
export const updateLibraryMembership = async (
  libraryId: string,
  templateId: string,
  data: {
    notes?: string;
    tags?: string[];
    order?: number;
  }
): Promise<LibraryMembership> => {
  const response = await apiClient.put<{ success: true; data: LibraryMembership }>(
    `/libraries/${libraryId}/templates/${templateId}`,
    data
  );
  return response.data.data;
};
