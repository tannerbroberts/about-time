// ==================== TYPES ====================

// Primitives
export type {
  UUID,
  Timestamp,
  Duration,
  VariableName,
  Quantity,
  StateLedger,
  TemplateId,
  RelationshipId,
  TemplateType,
} from './types/primitives.js';

// Template types
export type {
  ParentReference,
  BaseTemplate,
  Segment,
  LaneTemplate,
  BusyTemplate,
  Template,
  TemplateMap,
} from './types/template.js';

export { isBusyTemplate, isLaneTemplate } from './types/template.js';

// Validation types
export type {
  DoubleLinkingError,
  BusyOverlapError,
  UnsatisfiedConsumeError,
  UnsatisfiedProduceError,
  MissingTemplateError,
  DurationHierarchyError,
  NegativeOffsetError,
  ExceedsParentDurationError,
  ZeroDurationError,
  ValidationError,
  ValidationResult,
  VariableNameValidationResult,
} from './types/validation.js';

// ==================== TEMPLATE OPERATIONS ====================

// Create
export { createBusyTemplate } from './templates/createBusyTemplate.js';
export type { CreateBusyTemplateInput, IdGenerator } from './templates/createBusyTemplate.js';

export { createLaneTemplate } from './templates/createLaneTemplate.js';
export type { CreateLaneTemplateInput } from './templates/createLaneTemplate.js';

// Read
export { getTemplateById } from './templates/getTemplateById.js';

export { getTemplates } from './templates/getTemplates.js';
export type { GetTemplatesOptions } from './templates/getTemplates.js';

export { searchTemplates } from './templates/searchTemplates.js';

export { getVocabulary } from './templates/getVocabulary.js';

// Update
export { updateTemplate } from './templates/updateTemplate.js';
export type {
  BusyTemplateUpdates,
  LaneTemplateUpdates,
  TemplateUpdates,
  UpdateTemplateResult,
} from './templates/updateTemplate.js';

// Delete
export { deleteTemplate } from './templates/deleteTemplate.js';
export type { DeleteTemplateResult } from './templates/deleteTemplate.js';

// ==================== LAYOUT HELPERS ====================

export { applyLaneLayout } from './templates/layout/applyLaneLayout.js';
export type { LaneLayoutOptions } from './templates/layout/applyLaneLayout.js';

export { fitLaneDurationToLast } from './templates/layout/fitLaneDurationToLast.js';
export { packSegments } from './templates/layout/packSegments.js';
export { distributeSegmentOffsetsByInterval } from './templates/layout/distributeSegmentOffsetsByInterval.js';
export { equallyDistributeSegments } from './templates/layout/equallyDistributeSegments.js';
export { insertGap } from './templates/layout/insertGap.js';
export { addSegmentToEnd } from './templates/layout/addSegmentToEnd.js';
export { pushSegmentToStart } from './templates/layout/pushSegmentToStart.js';
export { insertSegmentAt } from './templates/layout/insertSegmentAt.js';
export { visualizeLane } from './templates/layout/visualizeLane.js';
export { visualizeLaneIds } from './templates/layout/visualizeLaneIds.js';

// ==================== VALIDATION ====================

export { validateLane } from './validation/validateLane.js';
export { validateVariableNames, UNIT_PATTERNS, MEASURABLE_SUBSTANCES } from './validation/validateVariableNames.js';