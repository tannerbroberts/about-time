import type { FocusPathItem } from '../store';

/**
 * Generate a unique key for a template instance in the lineage
 * Format: "A→B[120000]→C[60000]→E[0]"
 * This ensures the same template appearing multiple times gets unique React keys
 * @param lineage - Array of focus path items representing the template hierarchy
 * @returns Unique string key for React rendering
 */
export function generateLineageKey(lineage: FocusPathItem[]): string {
  return lineage
    .map((item) => {
      if (item.offset === undefined) {
        return item.templateId;
      }
      return `${item.templateId}[${item.offset}]`;
    })
    .join('→');
}

/**
 * Extract the last template ID from a lineage key
 * @param key - Lineage key string
 * @returns The last template ID in the lineage
 */
export function getLastTemplateIdFromKey(key: string): string {
  const parts = key.split('→');
  const lastPart = parts[parts.length - 1];
  // Remove offset notation if present: "A[1000]" -> "A"
  return lastPart.split('[')[0];
}
