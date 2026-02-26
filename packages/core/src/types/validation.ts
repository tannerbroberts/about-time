import type { TemplateId, Duration, Quantity, RelationshipId } from './primitives.js';
import type { BusyTemplate } from './template.js';

/** Double-linking between parent and child is inconsistent */
export interface DoubleLinkingError {
  type: 'double-linking-inconsistent';
  message: string;
  parentId: TemplateId;
  childId: TemplateId;
  relationshipId: RelationshipId;
  missingSide: 'parent' | 'child';
}

/** Busy templates overlap in time */
export interface BusyOverlapError {
  type: 'busy-overlap';
  message: string;
  template1Id: TemplateId;
  template1Intent: string;
  template2Id: TemplateId;
  template2Intent: string;
  overlapStart: Duration;
  overlapEnd: Duration;
}

/** A consume requirement cannot be satisfied */
export interface UnsatisfiedConsumeError {
  type: 'unsatisfied-consume';
  message: string;
  templateId: TemplateId;
  templateIntent: string;
  variableName: string;
  requiredQuantity: Quantity;
  availableQuantity: Quantity;
  absoluteOffset: Duration;
}

/** Produced output is never consumed */
export interface UnsatisfiedProduceError {
  type: 'unsatisfied-produce';
  message: string;
  templateId: TemplateId;
  templateIntent: string;
  variableName: string;
  producedQuantity: Quantity;
  consumedQuantity: Quantity;
}

/** Referenced template doesn't exist */
export interface MissingTemplateError {
  type: 'missing-template';
  message: string;
  missingTemplateId: TemplateId;
  referencedBy: TemplateId;
}

/** Child template duration >= parent duration (prevents infinite loops) */
export interface DurationHierarchyError {
  type: 'duration-hierarchy';
  message: string;
  parentId: TemplateId;
  parentIntent: string;
  parentDuration: Duration;
  childId: TemplateId;
  childIntent: string;
  childDuration: Duration;
}

/** Segment has negative offset (starts before parent) */
export interface NegativeOffsetError {
  type: 'negative-offset';
  message: string;
  parentId: TemplateId;
  parentIntent: string;
  childId: TemplateId;
  childIntent: string;
  offset: Duration;
}

/** Segment end time exceeds parent duration */
export interface ExceedsParentDurationError {
  type: 'exceeds-parent-duration';
  message: string;
  parentId: TemplateId;
  parentIntent: string;
  parentDuration: Duration;
  childId: TemplateId;
  childIntent: string;
  offset: Duration;
  childDuration: Duration;
  endTime: Duration;
}

/** Template has zero duration (invalid) */
export interface ZeroDurationError {
  type: 'zero-duration';
  message: string;
  templateId: TemplateId;
  templateIntent: string;
}

/** Union of all validation error types */
export type ValidationError =
  | DoubleLinkingError
  | BusyOverlapError
  | UnsatisfiedConsumeError
  | UnsatisfiedProduceError
  | MissingTemplateError
  | DurationHierarchyError
  | NegativeOffsetError
  | ExceedsParentDurationError
  | ZeroDurationError;

/** Result of lane validation */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  firstBusy: BusyTemplate | null;
  lastBusy: BusyTemplate | null;
  /** Variables required as input to the lane (consumed by first busy, not produced internally) */
  contractInputs: Record<string, Quantity>;
  /** Variables produced as output from the lane (produced by last busy, not consumed internally) */
  contractOutputs: Record<string, Quantity>;
  /** Variables that are both required and returned (borrowed and returned by the lane) */
  passThroughs: Record<string, Quantity>;
}

/** Result of variable name validation */
export interface VariableNameValidationResult {
  isValid: boolean;
  errors: string[];
}
