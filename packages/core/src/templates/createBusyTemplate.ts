import type { BusyTemplate, TemplateMap, StateLedger, UUID, Duration } from '../types/index.js';

export interface CreateBusyTemplateInput {
  intent: string;
  estimatedDuration: Duration;
  willConsume: StateLedger;
  willProduce: StateLedger;
  authorId?: UUID;
}

export type IdGenerator = () => string;

/**
 * Creates a new BusyTemplate and adds it to the map.
 * Mutates the map in place for O(1) performance.
 * 
 * @param input - Template properties
 * @param templates - Template map to add to (mutated in place)
 * @param generateId - Function to generate unique IDs (e.g., crypto.randomUUID)
 * @returns The created BusyTemplate
 * @throws Error if estimatedDuration is 0 or not specified
 */
export function createBusyTemplate(
  input: CreateBusyTemplateInput,
  templates: TemplateMap,
  generateId: IdGenerator,
): BusyTemplate {
  if (!input.estimatedDuration || input.estimatedDuration <= 0) {
    throw new Error('Template duration must be greater than 0');
  }

  const template: BusyTemplate = {
    templateType: 'busy',
    id: generateId(),
    intent: input.intent,
    authorId: input.authorId ?? 'unknown',
    estimatedDuration: input.estimatedDuration,
    references: [],
    willConsume: { ...input.willConsume },
    willProduce: { ...input.willProduce },
  };
  
  templates[template.id] = template;
  return template;
}
