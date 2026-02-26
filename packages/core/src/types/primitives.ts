/** Universally unique identifier */
export type UUID = string;

/** Unix timestamp in milliseconds */
export type Timestamp = number;

/** Duration in milliseconds */
export type Duration = number;

/** Variable name used in state ledgers */
export type VariableName = string;

/** Quantity of a variable */
export type Quantity = number;

/** Maps variable names to quantities */
export type StateLedger = Record<VariableName, Quantity>;

/** Template identifier */
export type TemplateId = string;

/** Relationship identifier for double-linking */
export type RelationshipId = string;

/** Template discriminator */
export type TemplateType = 'lane' | 'busy';
