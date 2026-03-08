/**
 * API client for template variables (confidence bounds)
 */

import { apiClient } from './client.js';

export interface TemplateVariable {
  id: string;
  templateId: string;
  variableName: string;
  variableType: 'produce' | 'consume';
  nominalValue: number;
  lowerBound?: number;
  upperBound?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertVariableRequest {
  variableName: string;
  variableType: 'produce' | 'consume';
  nominalValue: number;
  lowerBound?: number;
  upperBound?: number;
}

/**
 * Get all variables for a template
 */
export const getTemplateVariables = async (templateId: string): Promise<TemplateVariable[]> => {
  const response = await apiClient.get(`/api/template-variables/${templateId}`);
  return response.data.variables;
};

/**
 * Get variables for multiple templates (batch)
 */
export const getTemplateVariablesBatch = async (
  templateIds: string[],
): Promise<Record<string, TemplateVariable[]>> => {
  const response = await apiClient.post('/api/template-variables/batch', { templateIds });
  return response.data.variables;
};

/**
 * Upsert a single variable
 */
export const upsertTemplateVariable = async (
  templateId: string,
  data: UpsertVariableRequest,
): Promise<TemplateVariable> => {
  const response = await apiClient.put(`/api/template-variables/${templateId}`, data);
  return response.data.variable;
};

/**
 * Batch upsert variables for a template
 */
export const batchUpsertTemplateVariables = async (
  templateId: string,
  variables: UpsertVariableRequest[],
): Promise<TemplateVariable[]> => {
  const response = await apiClient.post(`/api/template-variables/${templateId}/batch`, { variables });
  return response.data.variables;
};

/**
 * Delete a variable
 */
export const deleteTemplateVariable = async (
  templateId: string,
  variableName: string,
  variableType: 'produce' | 'consume',
): Promise<void> => {
  await apiClient.delete(`/api/template-variables/${templateId}/${variableType}/${variableName}`);
};
