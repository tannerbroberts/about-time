/**
 * Confidence factor types for value ranges
 */

/**
 * Represents a value with optional confidence bounds.
 * Used to express uncertainty in template variable quantities.
 *
 * Examples:
 * - Exact value: { value: 100 }
 * - Range: { value: 100, lower: 90, upper: 110 }
 * - Asymmetric range: { value: 100, lower: 80, upper: 120 }
 */
export interface ValueWithConfidence {
  /** The expected or nominal value */
  value: number;

  /** Optional lower bound (minimum possible value) */
  lower?: number;

  /** Optional upper bound (maximum possible value) */
  upper?: number;
}

/**
 * Type guard to check if a value is a ValueWithConfidence object
 */
export function isValueWithConfidence(val: unknown): val is ValueWithConfidence {
  return (
    typeof val === 'object' &&
    val !== null &&
    'value' in val &&
    typeof (val as ValueWithConfidence).value === 'number'
  );
}

/**
 * Normalizes a number or ValueWithConfidence to always return ValueWithConfidence
 */
export function normalizeValue(val: number | ValueWithConfidence): ValueWithConfidence {
  if (typeof val === 'number') {
    return { value: val };
  }
  return val;
}

/**
 * Extracts the nominal value from either a number or ValueWithConfidence
 */
export function getNominalValue(val: number | ValueWithConfidence): number {
  return typeof val === 'number' ? val : val.value;
}

/**
 * Checks if a ValueWithConfidence has confidence bounds defined
 */
export function hasConfidenceBounds(val: ValueWithConfidence): boolean {
  return val.lower !== undefined || val.upper !== undefined;
}

/**
 * Gets the range width of a ValueWithConfidence
 * Returns 0 if no bounds are defined
 */
export function getConfidenceRange(val: ValueWithConfidence): number {
  if (!hasConfidenceBounds(val)) {
    return 0;
  }
  const lower = val.lower ?? val.value;
  const upper = val.upper ?? val.value;
  return upper - lower;
}

/**
 * Validates that confidence bounds are sensible
 * Returns null if valid, error message if invalid
 */
export function validateConfidenceBounds(val: ValueWithConfidence): string | null {
  if (val.lower !== undefined && val.lower > val.value) {
    return 'Lower bound cannot be greater than the nominal value';
  }
  if (val.upper !== undefined && val.upper < val.value) {
    return 'Upper bound cannot be less than the nominal value';
  }
  if (val.lower !== undefined && val.upper !== undefined && val.lower > val.upper) {
    return 'Lower bound cannot be greater than upper bound';
  }
  return null;
}
