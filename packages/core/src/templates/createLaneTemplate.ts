import type { LaneTemplate, TemplateMap, Segment, UUID, Duration } from '../types/index.js';

export interface CreateLaneTemplateInput {
  intent: string;
  estimatedDuration: Duration;
  segments: Segment[];
  authorId?: UUID;
}

export type IdGenerator = () => string;

/**
 * Creates a new LaneTemplate and adds it to the map.
 * Mutates the map in place for O(1) performance.
 * 
 * @param input - Template properties
 * @param templates - Template map to add to (mutated in place)
 * @param generateId - Function to generate unique IDs
 * @returns The created LaneTemplate
 * @throws Error if estimatedDuration is 0 or not specified
 */
export function createLaneTemplate(
  input: CreateLaneTemplateInput,
  templates: TemplateMap,
  generateId: IdGenerator,
): LaneTemplate {
  if (!input.estimatedDuration || input.estimatedDuration <= 0) {
    throw new Error('Template duration must be greater than 0');
  }

  const template: LaneTemplate = {
    templateType: 'lane',
    id: generateId(),
    intent: input.intent,
    authorId: input.authorId ?? 'unknown',
    estimatedDuration: input.estimatedDuration,
    references: [],
    segments: input.segments.map(s => ({ ...s })),
  };
  
  // Double-linking: update children to point back to this parent
  for (const segment of template.segments) {
    const child = templates[segment.templateId];
    if (child) {
      child.references.push({
        parentId: template.id,
        relationshipId: segment.relationshipId,
      });
    }
  }
  
  templates[template.id] = template;
  return template;
}
