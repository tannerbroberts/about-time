/**
 * Mathematical operations for confidence interval propagation
 */

import type { ValueWithConfidence } from './confidence.js';
import { getNominalValue, hasConfidenceBounds, normalizeValue } from './confidence.js';

/**
 * Adds two values with confidence bounds.
 * Propagates uncertainty using standard error propagation rules.
 *
 * For independent variables: (a±Δa) + (b±Δb) = (a+b) ± (Δa+Δb)
 */
export function addWithConfidence(
  a: number | ValueWithConfidence,
  b: number | ValueWithConfidence,
): ValueWithConfidence {
  const aVal = normalizeValue(a);
  const bVal = normalizeValue(b);

  const sum = aVal.value + bVal.value;

  // If neither has confidence bounds, return simple sum
  if (!hasConfidenceBounds(aVal) && !hasConfidenceBounds(bVal)) {
    return { value: sum };
  }

  // Calculate propagated bounds
  const aLower = aVal.lower ?? aVal.value;
  const aUpper = aVal.upper ?? aVal.value;
  const bLower = bVal.lower ?? bVal.value;
  const bUpper = bVal.upper ?? bVal.value;

  return {
    value: sum,
    lower: aLower + bLower,
    upper: aUpper + bUpper,
  };
}

/**
 * Multiplies a value with confidence by a scalar.
 *
 * For scalar multiplication: k(a±Δa) = (ka) ± (k·Δa)
 */
export function multiplyByScalar(
  val: number | ValueWithConfidence,
  scalar: number,
): ValueWithConfidence {
  const normalized = normalizeValue(val);

  if (scalar === 0) {
    return { value: 0 };
  }

  const product = normalized.value * scalar;

  if (!hasConfidenceBounds(normalized)) {
    return { value: product };
  }

  // For negative scalars, bounds flip
  const absScalar = Math.abs(scalar);
  const deltaLower = (normalized.value - (normalized.lower ?? normalized.value)) * absScalar;
  const deltaUpper = ((normalized.upper ?? normalized.value) - normalized.value) * absScalar;

  if (scalar < 0) {
    return {
      value: product,
      lower: product - deltaUpper,
      upper: product + deltaLower,
    };
  }

  return {
    value: product,
    lower: product - deltaLower,
    upper: product + deltaUpper,
  };
}

/**
 * Aggregates multiple values with confidence bounds.
 * Used for summing variables across multiple template instances.
 */
export function sumWithConfidence(
  values: Array<number | ValueWithConfidence>,
): ValueWithConfidence {
  if (values.length === 0) {
    return { value: 0 };
  }

  let result = normalizeValue(values[0]);

  for (let i = 1; i < values.length; i++) {
    result = addWithConfidence(result, values[i]);
  }

  return result;
}

/**
 * Calculates the relative uncertainty (coefficient of variation) of a value.
 * Returns 0 if no confidence bounds are defined.
 *
 * Useful for comparing uncertainty levels across different variables.
 */
export function getRelativeUncertainty(val: ValueWithConfidence): number {
  if (!hasConfidenceBounds(val) || val.value === 0) {
    return 0;
  }

  const lower = val.lower ?? val.value;
  const upper = val.upper ?? val.value;
  const range = upper - lower;
  const average = (upper + lower) / 2;

  return average === 0 ? 0 : range / (2 * Math.abs(average));
}

/**
 * Formats a ValueWithConfidence for display.
 * Examples:
 * - { value: 100 } → "100"
 * - { value: 100, lower: 90, upper: 110 } → "100 (90-110)"
 * - { value: 100, lower: 80, upper: 120 } → "100 (80-120)"
 */
export function formatWithConfidence(val: number | ValueWithConfidence): string {
  const normalized = normalizeValue(val);

  if (!hasConfidenceBounds(normalized)) {
    return String(normalized.value);
  }

  const lower = normalized.lower ?? normalized.value;
  const upper = normalized.upper ?? normalized.value;

  return `${normalized.value} (${lower}-${upper})`;
}
