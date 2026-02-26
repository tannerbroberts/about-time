import type { StateLedger, VariableNameValidationResult } from '../types/index.js';

/** Units that indicate a variable represents a measurable quantity */
const UNIT_PATTERNS = [
  // Volume
  'cups', 'cup', 'liters', 'liter', 'l', 'ml', 'milliliters', 'milliliter',
  'gallons', 'gallon', 'gal', 'quarts', 'quart', 'qt', 'pints', 'pint', 'pt',
  'tablespoons', 'tablespoon', 'tbsp', 'teaspoons', 'teaspoon', 'tsp',
  'floz', 'fl_oz', 'fluid_ounces', 'fluid_ounce',
  // Weight/Mass
  'grams', 'gram', 'g', 'kg', 'kilograms', 'kilogram',
  'pounds', 'pound', 'lbs', 'lb', 'ounces', 'ounce', 'oz',
  'mg', 'milligrams', 'milligram',
  // Length/Distance
  'meters', 'meter', 'm', 'km', 'kilometers', 'kilometer',
  'centimeters', 'centimeter', 'cm', 'millimeters', 'millimeter', 'mm',
  'inches', 'inch', 'in', 'feet', 'foot', 'ft', 'yards', 'yard', 'yd',
  'miles', 'mile', 'mi',
  // Time
  'seconds', 'second', 'sec', 's', 'minutes', 'minute', 'min',
  'hours', 'hour', 'hr', 'days', 'day', 'weeks', 'week',
  // Count/Quantity (unit-agnostic, acceptable as-is)
  'count', 'units', 'unit', 'pieces', 'piece', 'items', 'item',
  'servings', 'serving', 'portions', 'portion', 'batches', 'batch',
];

/** Substances that REQUIRE a unit suffix */
const MEASURABLE_SUBSTANCES = [
  'water', 'flour', 'sugar', 'salt', 'oil', 'butter', 'milk', 'cream',
  'rice', 'pasta', 'beans', 'coffee', 'tea', 'juice', 'wine', 'beer',
  'honey', 'syrup', 'vinegar', 'sauce', 'broth', 'stock',
  'meat', 'chicken', 'beef', 'pork', 'fish',
  'vegetables', 'fruit', 'cheese', 'eggs',
  'paint', 'cement', 'concrete', 'sand', 'gravel', 'soil', 'dirt',
  'fuel', 'gas', 'gasoline', 'diesel', 'propane',
  'chemicals', 'solution', 'mixture', 'compound',
  'fabric', 'thread', 'yarn', 'wire', 'cable', 'rope',
  'wood', 'lumber', 'metal', 'steel', 'aluminum', 'plastic',
];

/**
 * Validates that variable names for measurable substances include a unit.
 * 
 * @param variables - StateLedger to validate
 * @returns Validation result with any errors
 */
export function validateVariableNames(
  variables: StateLedger,
): VariableNameValidationResult {
  const errors: string[] = [];
  const variableNames = Object.keys(variables);

  for (const varName of variableNames) {
    const lowerName = varName.toLowerCase();
    const parts = lowerName.split(/[_\s-]+/);

    const containsSubstance = MEASURABLE_SUBSTANCES.some(substance =>
      parts.includes(substance) || lowerName.includes(substance)
    );

    if (containsSubstance) {
      const containsUnit = UNIT_PATTERNS.some(unit => {
        return parts.includes(unit) ||
          lowerName.endsWith(`_${unit}`) ||
          lowerName.endsWith(`-${unit}`) ||
          (unit.length === 1 && parts.some(p => p === unit));
      });

      if (!containsUnit) {
        errors.push(
          `Variable "${varName}" contains a measurable substance but no unit. ` +
          `Example: "water_cups", "flour_grams", "oil_ml".`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/** Exported for testing/extension */
export { UNIT_PATTERNS, MEASURABLE_SUBSTANCES };
