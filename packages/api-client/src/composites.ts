/**
 * API client for composite unit definitions
 */

import type { CompositeUnitDefinition } from '@about-time/types/composite';
import type { ValueWithConfidence } from '@about-time/types/confidence';

import { apiClient } from './client.js';

/**
 * Get all composites for the authenticated user
 */
export const getUserComposites = async (): Promise<CompositeUnitDefinition[]> => {
  const response = await apiClient.get('/api/composites');
  return response.data.composites;
};

/**
 * Get a specific composite by ID
 */
export const getCompositeById = async (compositeId: string): Promise<CompositeUnitDefinition> => {
  const response = await apiClient.get(`/api/composites/${compositeId}`);
  return response.data.composite;
};

/**
 * Get all versions of a composite
 */
export const getCompositeVersions = async (compositeId: string): Promise<CompositeUnitDefinition[]> => {
  const response = await apiClient.get(`/api/composites/${compositeId}/versions`);
  return response.data.versions;
};

/**
 * Create a new composite definition
 */
export const createComposite = async (data: {
  name: string;
  composition: Record<string, ValueWithConfidence>;
  changelog?: string;
}): Promise<CompositeUnitDefinition> => {
  const response = await apiClient.post('/api/composites', data);
  return response.data.composite;
};

/**
 * Update a composite (creates a new version)
 */
export const updateComposite = async (
  compositeId: string,
  data: {
    composition: Record<string, ValueWithConfidence>;
    changelog?: string;
  },
): Promise<CompositeUnitDefinition> => {
  const response = await apiClient.put(`/api/composites/${compositeId}`, data);
  return response.data.composite;
};

/**
 * Delete a composite
 */
export const deleteComposite = async (compositeId: string): Promise<void> => {
  await apiClient.delete(`/api/composites/${compositeId}`);
};

/**
 * Fork a composite (create a copy with new ownership)
 */
export const forkComposite = async (
  compositeId: string,
  data?: {
    changelog?: string;
  },
): Promise<CompositeUnitDefinition> => {
  const response = await apiClient.post(`/api/composites/${compositeId}/fork`, data || {});
  return response.data.composite;
};

/**
 * Create a live-linked reference to a composite
 */
export const createLiveLink = async (
  compositeId: string,
  data?: {
    changelog?: string;
  },
): Promise<CompositeUnitDefinition> => {
  const response = await apiClient.post(`/api/composites/${compositeId}/live-link`, data || {});
  return response.data.composite;
};
