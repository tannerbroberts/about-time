/**
 * Composite variable expansion algorithm
 *
 * Expands a composite variable by multiplying all component values by a count.
 * Preserves confidence intervals by applying the same multiplier.
 */

import type { ValueWithConfidence } from '@about-time/types/confidence';
import { normalizeValue } from '@about-time/types/confidence';
import { multiplyByScalar } from '@about-time/types/confidenceMath';

/**
 * Expands a composite unit definition by multiplying all values by a count
 *
 * @param composition - The composite definition (map of variable names to values)
 * @param count - The multiplier (e.g., 2 for "2 meals")
 * @returns Expanded values with confidence preserved
 *
 * @example
 * ```typescript
 * const composition = {
 *   calories: { value: 500, lower: 450, upper: 550 },
 *   protein_g: { value: 50, lower: 45, upper: 55 }
 * };
 *
 * const expanded = expandComposite(composition, 2);
 * // Result: {
 * //   calories: { value: 1000, lower: 900, upper: 1100 },
 * //   protein_g: { value: 100, lower: 90, upper: 110 }
 * // }
 * ```
 */
export function expandComposite(
  composition: Record<string, ValueWithConfidence>,
  count: number,
): Record<string, ValueWithConfidence> {
  if (count < 0) {
    throw new Error('Count must be non-negative');
  }

  if (count === 0) {
    // Return all zeros
    const result: Record<string, ValueWithConfidence> = {};
    for (const key of Object.keys(composition)) {
      result[key] = { value: 0, lower: 0, upper: 0 };
    }
    return result;
  }

  const expanded: Record<string, ValueWithConfidence> = {};

  for (const [variableName, value] of Object.entries(composition)) {
    const normalized = normalizeValue(value);
    expanded[variableName] = multiplyByScalar(normalized, count);
  }

  return expanded;
}

/**
 * Expands multiple composite references at once
 *
 * Useful for aggregating multiple composite variables in a template.
 *
 * @param composites - Array of composite compositions and their counts
 * @returns Map of variable names to their total expanded values
 *
 * @example
 * ```typescript
 * const meal = { calories: { value: 500 }, protein_g: { value: 50 } };
 * const snack = { calories: { value: 200 }, fat_g: { value: 10 } };
 *
 * const expanded = expandMultipleComposites([
 *   { composition: meal, count: 3 },
 *   { composition: snack, count: 2 }
 * ]);
 * // Result: {
 * //   calories: { value: 1900 },      // 3*500 + 2*200
 * //   protein_g: { value: 150 },      // 3*50 + 0
 * //   fat_g: { value: 20 }            // 0 + 2*10
 * // }
 * ```
 */
export function expandMultipleComposites(
  composites: Array<{
    composition: Record<string, ValueWithConfidence>;
    count: number;
  }>,
): Record<string, ValueWithConfidence> {
  const aggregated: Record<string, ValueWithConfidence> = {};

  for (const { composition, count } of composites) {
    const expanded = expandComposite(composition, count);

    for (const [variableName, value] of Object.entries(expanded)) {
      if (aggregated[variableName]) {
        // Add to existing value
        const existing = aggregated[variableName];
        aggregated[variableName] = {
          value: existing.value + value.value,
          lower:
            existing.lower !== undefined && value.lower !== undefined
              ? existing.lower + value.lower
              : undefined,
          upper:
            existing.upper !== undefined && value.upper !== undefined
              ? existing.upper + value.upper
              : undefined,
        };
      } else {
        // First occurrence
        aggregated[variableName] = value;
      }
    }
  }

  return aggregated;
}

/**
 * Validates that a composition is well-formed
 *
 * @param composition - The composite definition to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateComposition(composition: Record<string, ValueWithConfidence>): string[] {
  const errors: string[] = [];

  if (Object.keys(composition).length === 0) {
    errors.push('Composition must have at least one variable');
  }

  for (const [variableName, value] of Object.entries(composition)) {
    if (!variableName || variableName.trim().length === 0) {
      errors.push('Variable name cannot be empty');
    }

    if (typeof value.value !== 'number' || !isFinite(value.value)) {
      errors.push(`Invalid value for variable "${variableName}": must be a finite number`);
    }

    if (value.lower !== undefined) {
      if (typeof value.lower !== 'number' || !isFinite(value.lower)) {
        errors.push(`Invalid lower bound for variable "${variableName}": must be a finite number`);
      } else if (value.lower > value.value) {
        errors.push(`Lower bound for variable "${variableName}" cannot exceed nominal value`);
      }
    }

    if (value.upper !== undefined) {
      if (typeof value.upper !== 'number' || !isFinite(value.upper)) {
        errors.push(`Invalid upper bound for variable "${variableName}": must be a finite number`);
      } else if (value.upper < value.value) {
        errors.push(`Upper bound for variable "${variableName}" cannot be less than nominal value`);
      }
    }
  }

  return errors;
}
