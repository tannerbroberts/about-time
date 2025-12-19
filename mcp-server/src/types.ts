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

interface BaseTemplate {
  id: TemplateId;
  intent: string;
  authorId: UUID;
  version: SemVer;
  estimatedDuration: Duration;
}

export interface Segment {
  templateId: TemplateId;
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

// Storage types
export interface TemplateLibrary {
  version: string;
  templates: Template[];
}
