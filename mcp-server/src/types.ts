// Type definitions for about-time templates
// These mirror the types in the main app

export type UUID = string;
export type SemVer = string;
export type Timestamp = number;
export type Duration = number;

export type VariableName = string;
export type Quantity = number;
export type StateLedger = Record<VariableName, Quantity>;

export type TemplateId = string;
export type TemplateType = 'lane' | 'busy';
export type RelationshipId = string;

export interface ParentReference {
  parentId: TemplateId;
  relationshipId: RelationshipId;
}

interface BaseTemplate {
  id: TemplateId;
  intent: string;
  authorId: UUID;
  version?: SemVer;
  estimatedDuration: Duration;
  references: ParentReference[];
}

export interface Segment {
  templateId: TemplateId;
  relationshipId: RelationshipId;
  offset: Duration;
}

export interface LaneTemplate extends BaseTemplate {
  templateType: 'lane';
  segments: Segment[];
}

export interface BusyTemplate extends BaseTemplate {
  templateType: 'busy';
  willConsume: StateLedger;
  willProduce: StateLedger;
}

export type Template = LaneTemplate | BusyTemplate;

// TemplateMap for use with the core library functions
export type TemplateMap = Record<TemplateId, Template>;

// Storage types
export interface TemplateLibrary {
  version: string;
  templates: Template[];
}
