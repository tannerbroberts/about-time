import type {
  UUID,
  Duration,
  TemplateId,
  RelationshipId,
  StateLedger,
} from './primitives.js';

/** Reference to a parent template that uses this template as a segment */
export interface ParentReference {
  parentId: TemplateId;
  relationshipId: RelationshipId;
}

/** Base properties shared by all templates */
export interface BaseTemplate {
  id: TemplateId;
  intent: string;
  authorId: UUID;
  estimatedDuration: Duration;
  references: ParentReference[];
}

/** Reference to a template within a lane, with timing offset */
export interface Segment {
  templateId: TemplateId;
  relationshipId: RelationshipId;
  offset: Duration;
}

/** Lane template - sequences other templates */
export interface LaneTemplate extends BaseTemplate {
  templateType: 'lane';
  segments: Segment[];
}

/** Busy template - atomic activity with state transitions */
export interface BusyTemplate extends BaseTemplate {
  templateType: 'busy';
  willConsume: StateLedger;
  willProduce: StateLedger;
}

/** Union of all template types */
export type Template = LaneTemplate | BusyTemplate;

/**
 * High-performance template storage indexed by ID.
 * CRUD operations mutate in-place for O(1) updates.
 * Use structuredClone() or spread if you need immutable snapshots.
 */
export type TemplateMap = Record<TemplateId, Template>;

/** Type guard for BusyTemplate */
export function isBusyTemplate(t: Template): t is BusyTemplate {
  return t.templateType === 'busy';
}

/** Type guard for LaneTemplate */
export function isLaneTemplate(t: Template): t is LaneTemplate {
  return t.templateType === 'lane';
}
