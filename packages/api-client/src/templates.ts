/**
 * Template API endpoints
 */

import { apiClient } from './client.js';
import { queueTemplateCreate, queueTemplateUpdate, queueTemplateDelete } from './offlineQueue.js';
import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';
import type { TemplateListQuery, TemplateListResponse, TemplateHierarchyResponse } from '@about-time/types';

/**
 * Fetch templates with pagination and filtering
 */
export const fetchTemplates = async (
  query?: TemplateListQuery
): Promise<{ templates: Template[]; total: number }> => {
  const params = new URLSearchParams();

  if (query?.offset !== undefined) params.append('offset', query.offset.toString());
  if (query?.limit !== undefined) params.append('limit', query.limit.toString());
  if (query?.templateType) params.append('templateType', query.templateType);
  if (query?.searchIntent) params.append('searchIntent', query.searchIntent);
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

  const response = await apiClient.get<{ success: true; data: TemplateListResponse }>(
    `/templates?${params.toString()}`
  );

  return response.data.data;
};

/**
 * Fetch all templates as TemplateMap
 */
export const fetchTemplateMap = async (): Promise<TemplateMap> => {
  const { templates } = await fetchTemplates({ limit: 1000 });
  const map: TemplateMap = {};
  for (const template of templates) {
    map[template.id] = template;
  }
  return map;
};

/**
 * Get single template by ID
 */
export const getTemplate = async (templateId: string): Promise<Template> => {
  const response = await apiClient.get<{ success: true; data: Template }>(
    `/templates/${templateId}`
  );
  return response.data.data;
};

/**
 * Create new template (with offline queueing)
 */
export const createTemplate = async (template: Template): Promise<Template> => {
  const result = await queueTemplateCreate(
    async () => {
      const response = await apiClient.post<{ success: true; data: Template }>(
        '/templates',
        { template }
      );
      return response.data.data;
    },
    template
  );

  // If queued (offline), return the template as-is for optimistic update
  return result || template;
};

/**
 * Update existing template (with offline queueing)
 */
export const updateTemplate = async (template: Template): Promise<Template> => {
  const result = await queueTemplateUpdate(
    async () => {
      const response = await apiClient.put<{ success: true; data: Template }>(
        `/templates/${template.id}`,
        { template }
      );
      return response.data.data;
    },
    template
  );

  // If queued (offline), return the template as-is for optimistic update
  return result || template;
};

/**
 * Delete template (with offline queueing)
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
  await queueTemplateDelete(
    async () => {
      await apiClient.delete(`/templates/${templateId}`);
    },
    templateId
  );
};

/**
 * Get template hierarchy (with children)
 */
export const getTemplateHierarchy = async (templateId: string): Promise<{
  template: Template;
  children: Template[];
  relationships: Array<{ relationshipId: string; childTemplateId: string; offset: number }>;
}> => {
  const response = await apiClient.get<{ success: true; data: TemplateHierarchyResponse }>(
    `/templates/${templateId}/children`
  );
  return response.data.data;
};
