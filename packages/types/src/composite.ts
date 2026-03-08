/**
 * Composite variable types for About Time
 *
 * Composite variables allow grouping multiple atomic variables together
 * into reusable units (e.g., "complete_meal" = 500 calories + 50g protein).
 */

import type { ValueWithConfidence } from './confidence.js';

/**
 * Defines a composite unit - a named grouping of variables with their values
 *
 * @example
 * ```typescript
 * const mealComposite: CompositeUnitDefinition = {
 *   id: '123',
 *   name: 'complete_meal',
 *   version: 1,
 *   composition: {
 *     calories: { value: 500, lower: 450, upper: 550 },
 *     protein_g: { value: 50, lower: 45, upper: 55 }
 *   },
 *   authorId: 'user-123',
 *   originCompositeId: null,
 *   linkType: 'original',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   changelog: 'Initial definition'
 * }
 * ```
 */
export interface CompositeUnitDefinition {
  /** Unique identifier for this composite definition */
  id: string;

  /** Human-readable name for the composite (e.g., 'complete_meal') */
  name: string;

  /** Version number for tracking changes over time */
  version: number;

  /** Map of variable names to their values with confidence bounds */
  composition: Record<string, ValueWithConfidence>;

  /** User ID who created this composite */
  authorId: string;

  /** If forked or live-linked, the ID of the original composite */
  originCompositeId: string | null;

  /** How this composite relates to its origin */
  linkType: 'original' | 'forked' | 'live-linked';

  /** When this definition was created */
  createdAt: Date;

  /** When this definition was last updated */
  updatedAt: Date;

  /** Optional changelog describing version changes */
  changelog?: string;
}

/**
 * A reference to a composite that stays linked to the latest version
 *
 * Live references automatically pull updates when the source composite changes.
 * Use this when you want templates to automatically receive updates.
 *
 * @example
 * ```typescript
 * const liveRef: CompositeLiveReference = {
 *   compositeName: 'complete_meal',
 *   compositeId: '123',
 *   count: 3, // three meals
 *   confidence: 0.9 // 90% confidence in the multiplier
 * }
 * ```
 */
export interface CompositeLiveReference {
  /** Name of the composite being referenced */
  compositeName: string;

  /** ID of the composite definition being referenced */
  compositeId: string;

  /** How many times to count this composite (multiplier) */
  count: number;

  /** Optional confidence level in the count value (0-1) */
  confidence?: number;
}

/**
 * A snapshot of a composite at a specific version and time
 *
 * Snapshots are frozen copies that won't change even if the source composite
 * is updated. Use this when you want stability over automatic updates.
 *
 * @example
 * ```typescript
 * const snapshot: CompositeSnapshot = {
 *   compositeName: 'complete_meal',
 *   compositeId: '123',
 *   version: 2,
 *   count: 3,
 *   confidence: 0.95,
 *   expandedValues: {
 *     calories: { value: 1500, lower: 1350, upper: 1650 },
 *     protein_g: { value: 150, lower: 135, upper: 165 }
 *   },
 *   snapshotAt: new Date('2024-01-01')
 * }
 * ```
 */
export interface CompositeSnapshot {
  /** Name of the composite when snapshot was taken */
  compositeName: string;

  /** ID of the source composite definition */
  compositeId: string;

  /** Version number of the composite when snapshot was taken */
  version: number;

  /** How many times this composite is counted (multiplier) */
  count: number;

  /** Optional confidence level in the count value (0-1) */
  confidence?: number;

  /** The actual expanded values at snapshot time (count * composition) */
  expandedValues: Record<string, ValueWithConfidence>;

  /** When this snapshot was taken */
  snapshotAt: Date;
}

/**
 * Union type representing any kind of variable value
 *
 * Variables can be:
 * - Atomic: Simple numeric values with optional confidence bounds
 * - Composite-live: References to composites that auto-update
 * - Composite-snapshot: Frozen snapshots of composites at a point in time
 *
 * @example
 * ```typescript
 * // Atomic value
 * const atomic: VariableValue = {
 *   type: 'atomic',
 *   data: { value: 100, lower: 90, upper: 110 }
 * };
 *
 * // Live reference
 * const live: VariableValue = {
 *   type: 'composite-live',
 *   data: { compositeName: 'meal', compositeId: '123', count: 2 }
 * };
 *
 * // Snapshot
 * const snapshot: VariableValue = {
 *   type: 'composite-snapshot',
 *   data: {
 *     compositeName: 'meal',
 *     compositeId: '123',
 *     version: 1,
 *     count: 2,
 *     expandedValues: { calories: { value: 1000 } },
 *     snapshotAt: new Date()
 *   }
 * };
 * ```
 */
export type VariableValue =
  | { type: 'atomic'; data: ValueWithConfidence }
  | { type: 'composite-live'; data: CompositeLiveReference }
  | { type: 'composite-snapshot'; data: CompositeSnapshot };

/**
 * Type guard to check if a value is an atomic variable
 */
export function isAtomicValue(value: VariableValue): value is { type: 'atomic'; data: ValueWithConfidence } {
  return value.type === 'atomic';
}

/**
 * Type guard to check if a value is a live composite reference
 */
export function isCompositeLiveValue(
  value: VariableValue,
): value is { type: 'composite-live'; data: CompositeLiveReference } {
  return value.type === 'composite-live';
}

/**
 * Type guard to check if a value is a composite snapshot
 */
export function isCompositeSnapshotValue(
  value: VariableValue,
): value is { type: 'composite-snapshot'; data: CompositeSnapshot } {
  return value.type === 'composite-snapshot';
}

/**
 * Extract the nominal value from any variable value type
 *
 * For atomic values, returns the value directly.
 * For composites, sums all expanded values.
 */
export function getVariableValue(value: VariableValue, variableName?: string): number {
  if (isAtomicValue(value)) {
    return value.data.value;
  }

  if (isCompositeLiveValue(value)) {
    throw new Error('Cannot get value from live reference without expansion. Use expansion algorithm first.');
  }

  if (isCompositeSnapshotValue(value)) {
    if (!variableName) {
      throw new Error('Variable name required to extract value from composite snapshot');
    }
    const expanded = value.data.expandedValues[variableName];
    return expanded ? expanded.value : 0;
  }

  throw new Error('Unknown variable value type');
}
